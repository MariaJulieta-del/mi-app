/**
 * Descarga imágenes de ejercicios a public/images/exercises/
 * Ejecutar UNA SOLA VEZ desde gymtrack-frontend:
 *   node download-exercise-images.js
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'
const DEST = path.join(__dirname, 'public', 'images', 'exercises')

// Cada entrada puede tener múltiples nombres a probar en orden
const IMAGES = {
  // Pecho
  p01: ['Barbell_Bench_Press_-_Medium_Grip', 'Bench_Press'],
  p02: ['Incline_Barbell_Bench_Press', 'Barbell_Incline_Bench_Press_-_Medium_Grip', 'Incline_Bench_Press'],
  p03: ['Decline_Barbell_Bench_Press', 'Decline_Bench_Press'],
  p04: ['Dumbbell_Flyes', 'Dumbbell_Fly', 'Dumbbell_Flys'],
  p05: ['Push-Up', 'Pushup', 'Push_Up', 'Pushups'],
  p06: ['Cable_Crossover', 'Cable_Cross_Over'],
  p07: ['Chest_Dip', 'Dips_-_Chest_Version', 'Chest_Dips'],
  p08: ['Pec_Deck_Fly', 'Pec_Deck', 'Pec_Deck_Flyes'],
  // Espalda
  e01: ['Pull-Up', 'Pullup', 'Pull_Up', 'Chin_Up', 'Pullups'],
  e02: ['Lat_Pulldown', 'Pulldown', 'Lat_Pull_Down'],
  e03: ['Seated_Cable_Row', 'Cable_Row', 'Seated_Row'],
  e04: ['Bent_Over_Barbell_Row', 'Barbell_Row'],
  e05: ['Barbell_Deadlift', 'Deadlift'],
  e06: ['T-Bar_Row', 'T_Bar_Row', 'Tbar_Row'],
  e07: ['Dumbbell_Pullover', 'Pullover'],
  e08: ['Hyperextensions', 'Hyperextension', 'Back_Extension', 'Hyperextensions_-_With_Round_Back'],
  // Hombros
  h01: ['Barbell_Shoulder_Press', 'Overhead_Press', 'Military_Press', 'Barbell_Military_Press'],
  h02: ['Dumbbell_Lateral_Raise', 'Lateral_Raise', 'Side_Lateral_Raise'],
  h03: ['Dumbbell_Alternate_Front_Raise', 'Front_Raise', 'Dumbbell_Front_Raise', 'Alternate_Front_Raise'],
  h04: ['Arnold_Dumbbell_Press', 'Arnold_Press'],
  h05: ['Rear_Lateral_Raise', 'Rear_Delt_Fly', 'Reverse_Fly', 'Bent_Over_Rear_Delt_Raise'],
  h06: ['Barbell_Shrug', 'Shrug', 'Dumbbell_Shrug'],
  // Bíceps
  b01: ['Barbell_Curl', 'Curl', 'Barbell_Bicep_Curl'],
  b02: ['Dumbbell_Bicep_Curl', 'Dumbbell_Curl', 'Bicep_Curl'],
  b03: ['Alternate_Hammer_Curl', 'Hammer_Curl'],
  b04: ['Barbell_Preacher_Curl', 'Preacher_Curl', 'Preacher_Barbell_Curl'],
  b05: ['Concentration_Curls', 'Concentration_Curl'],
  // Tríceps
  t01: ['Close-Grip_Barbell_Bench_Press', 'Close_Grip_Bench_Press', 'Close-Grip_Bench_Press'],
  t02: ['Cable_Pushdown', 'Triceps_Pushdown', 'Tricep_Pushdown', 'Cable_Triceps_Pushdown'],
  t03: ['Barbell_Skull_Crusher', 'Skull_Crusher', 'Skullcrusher_Barbell', 'EZ-Bar_Skullcrusher'],
  t04: ['Dumbbell_One_Arm_Triceps_Extension', 'Triceps_Extension', 'Overhead_Triceps_Extension'],
  t05: ['Triceps_Dip', 'Tricep_Dip', 'Dips_-_Triceps_Version', 'Bench_Dip'],
  // Cuádriceps
  q01: ['Barbell_Squat', 'Squat', 'Squats'],
  q02: ['Leg_Press', 'Leg_Press_-_45_Degrees'],
  q03: ['Leg_Extensions', 'Leg_Extension', 'Leg_Extensions_-_Machine'],
  q04: ['Dumbbell_Lunges', 'Lunge', 'Lunges', 'Walking_Lunges'],
  q05: ['Barbell_Hack_Squat', 'Hack_Squat'],
  // Femoral
  f01: ['Romanian_Deadlift', 'Romanian_Deadlifts', 'Stiff_Leg_Deadlift'],
  f02: ['Lying_Leg_Curls', 'Leg_Curl', 'Lying_Leg_Curl', 'Leg_Curls'],
  f03: ['Standing_Leg_Curl', 'Standing_Leg_Curls'],
  f04: ['Good_Morning', 'Good_Mornings'],
  // Glúteos
  g01: ['Barbell_Hip_Thrust', 'Hip_Thrust'],
  g02: ['Cable_Hip_Adduction', 'Cable_Hip_Abductor', 'Hip_Abduction', 'Cable_Glute_Kickback'],
  g03: ['Sumo_Squat', 'Sumo_Deadlift', 'Wide_Stance_Barbell_Squat'],
  g04: ['Barbell_Step_Ups', 'Step_Up', 'Step_Ups', 'Barbell_Step-Ups'],
  // Pantorrillas
  c01: ['Standing_Calf_Raises', 'Calf_Raise', 'Standing_Calf_Raise', 'Calf_Raises'],
  c02: ['Barbell_Seated_Calf_Raise', 'Seated_Calf_Raise', 'Seated_Calf_Raises'],
  c03: ['Barbell_Standing_Calf_Raise', 'Standing_Barbell_Calf_Raise'],
  // Abdominales
  a01: ['Crunch', 'Crunches', 'Crunchs'],
  a02: ['Plank', 'Front_Plank'],
  a03: ['Russian_Twist', 'Russian_Twists'],
  a04: ['Leg_Raises', 'Leg_Raise', 'Hanging_Leg_Raise', 'Lying_Leg_Raises'],
  a05: ['Cable_Crunch', 'Kneeling_Cable_Crunch'],
  a06: ['Ab_Roller', 'Ab_Wheel_Rollout', 'Wheel_Rollout'],
  a07: ['Mountain_Climber', 'Mountain_Climbers'],
  // Cardio
  cd01: ['Treadmill', 'Jogging_Treadmill'],
  cd02: ['Bicycling_Stationary', 'Stationary_Bike', 'Cycling'],
  cd03: ['Rowing_Ergometer', 'Rowing', 'Row_Ergometer'],
  cd04: ['Jump_Rope', 'Jumping_Rope', 'Skipping_Rope'],
  cd05: ['Burpees', 'Burpee'],
  cd06: ['Elliptical_Trainer', 'Elliptical'],
  // Antebrazos
  af01: ['Wrist_Curl', 'Barbell_Wrist_Curl'],
  af02: ['Wrist_Extension', 'Reverse_Wrist_Curl'],
  // Lumbares
  l01: ['Back_Extension', 'Back_Extensions', 'Hyperextensions'],
  l02: ['Superman', 'Supermans', 'Superman_Back_Extension'],
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

async function downloadFirst(candidates, dest) {
  for (const folder of candidates) {
    const url = `${BASE}/${folder}/0.jpg`
    try {
      const data = await fetchUrl(url)
      if (data.length > 1000) {
        fs.writeFileSync(dest, data)
        return folder
      }
    } catch { /* probar siguiente */ }
  }
  return null
}

async function main() {
  if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true })

  let ok = 0, fail = 0
  const failures = []
  const mapping = {}

  for (const [id, candidates] of Object.entries(IMAGES)) {
    const dest = path.join(DEST, `${id}.jpg`)
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`  ✓ ${id} (ya existe)`)
      ok++
      continue
    }
    const found = await downloadFirst(candidates, dest)
    if (found) {
      console.log(`  ✓ ${id} → ${found}`)
      mapping[id] = found
      ok++
    } else {
      console.warn(`  ✗ ${id} — ningún nombre funcionó: ${candidates.join(', ')}`)
      failures.push(id)
      fail++
    }
  }

  console.log(`\nResultado: ${ok} OK, ${fail} fallidas`)
  if (failures.length) {
    console.log('Aún fallidas:', failures.join(', '))
    console.log('\nPara estas, buscalas manualmente en:')
    console.log('https://github.com/yuhonas/free-exercise-db/tree/main/exercises')
  } else {
    console.log('¡Todas las imágenes descargadas correctamente!')
  }
}

main().catch(console.error)
