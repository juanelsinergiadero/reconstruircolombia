// =============================================================
// reconstruircolombia — Seed DIVIPOLA (DANE)
// =============================================================
// Siembra Departamento y Municipio desde los CSV oficiales del DANE.
// Idempotente: usa upsert, se puede correr varias veces sin duplicar.
//
// Columnas verificadas:
//   departamentos.csv: codigo_departamento, nombre_departamento, longitud, latitud
//   municipios.csv:    cod_dpto, dpto, cod_mpio, nom_mpio, tipo_municipio, longitud, latitud
//
// csv-parse respeta campos entrecomillados: las comas decimales de las
// coordenadas ("-75,581775") NO rompen el parseo (split(',') si lo hacia).
// =============================================================

import { PrismaClient } from '@prisma/client'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const prisma = new PrismaClient()

const DATA_DIR = join(__dirname, 'data')

function parseCsv(contenido: string): Record<string, string>[] {
  return parse(contenido, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
}

// Coordenada del DANE: coma decimal -> punto. null si no parsea.
function parseCoord(valor: string | undefined): number | null {
  if (!valor) return null
  const normalizado = valor.replace(',', '.')
  const num = Number(normalizado)
  return Number.isFinite(num) ? num : null
}

// Slug legible: minusculas, sin tildes, guiones.
function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function seedDepartamentos() {
  const csv = readFileSync(join(DATA_DIR, 'departamentos.csv'), 'utf-8')
  const filas = parseCsv(csv)

  for (const fila of filas) {
    const codigo = fila['codigo_departamento']
    if (!codigo) continue
    await prisma.departamento.upsert({
      where: { codigo },
      update: {
        nombre: fila['nombre_departamento'],
        latitud: parseCoord(fila['latitud']),
        longitud: parseCoord(fila['longitud']),
      },
      create: {
        codigo,
        nombre: fila['nombre_departamento'],
        latitud: parseCoord(fila['latitud']),
        longitud: parseCoord(fila['longitud']),
      },
    })
  }
  console.log(`Departamentos sembrados: ${filas.length}`)
}

async function seedMunicipios() {
  const csv = readFileSync(join(DATA_DIR, 'municipios.csv'), 'utf-8')
  const filas = parseCsv(csv)

  let sembrados = 0
  for (const fila of filas) {
    const codigo = fila['cod_mpio']
    const departamentoCodigo = fila['cod_dpto']
    if (!codigo || !departamentoCodigo) continue

    await prisma.municipio.upsert({
      where: { codigo },
      update: {
        nombre: fila['nom_mpio'],
        slug: slugify(fila['nom_mpio']),
        tipoMunicipio: fila['tipo_municipio'] || null,
        latitud: parseCoord(fila['latitud']),
        longitud: parseCoord(fila['longitud']),
        departamentoCodigo,
      },
      create: {
        codigo,
        nombre: fila['nom_mpio'],
        slug: slugify(fila['nom_mpio']),
        tipoMunicipio: fila['tipo_municipio'] || null,
        latitud: parseCoord(fila['latitud']),
        longitud: parseCoord(fila['longitud']),
        departamentoCodigo,
      },
    })
    sembrados++
  }
  console.log(`Municipios sembrados: ${sembrados}`)
}

async function main() {
  console.log('Iniciando seed DIVIPOLA...')
  await seedDepartamentos()
  await seedMunicipios()
  console.log('Seed DIVIPOLA completado.')
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
