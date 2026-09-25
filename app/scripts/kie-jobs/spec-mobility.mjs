// KI-Bilder für die Mobility-Übungen (mobilityExercises.ts), 26.09.2026.
// Gleicher Stil und dieselbe Person wie bei den 19 Übungen (spec.mjs). Halteübungen und Tests bekommen
// ein Bild („Haltung“, noEndPhoto), Bewegungen mit klarer Start- und Endposition zwei Bilder.
//   node scripts/kie-jobs/make.mjs start scripts/kie-jobs/spec-mobility.mjs
//   node scripts/kie-jobs/make.mjs end   scripts/kie-jobs/spec-mobility.mjs
export { STYLE, STYLE_REFS } from './spec.mjs'
// Nano Banana 2: 8 Credits je Bild (gemessen 26.09.2026), Stil und Standardposen gut; GPT Image 2 kostet 18, die Lite-Variante (4) verfehlt Posen
export const MODEL = 'nano-banana-2'
export const REF_FIELD = 'image_input'
export const TAG = 'mob'

const WALL = 'a plain light-grey wall'
const DOOR = 'a plain white doorframe'
const RACK = 'a free-standing black steel pull-up rack (two vertical uprights on an H-shaped floor base, horizontal bar on top at about 190 cm)'
const KB = 'an 8 kg cast-iron kettlebell'
const TOWEL = 'a folded grey towel'
const RULER = 'a wooden folding ruler lying on the floor'
const SIDE = 'Camera at floor level from the side, athlete facing to the right of the frame.'
const SIDE_HIGH = 'Camera at hip height from the side, athlete facing to the right of the frame.'
const FRONT = 'Camera at chest height from a front three-quarter angle.'
const BACK = 'Camera at chest height from behind at a slight angle.'

export const EXERCISES = [
  // ---------- Dynamisch ----------
  { id: 'shoulder-circles', key: 'shoulder_circles', single: true,
    start: `Arm circles: standing upright with feet hip-width apart, both arms fully extended and swept out to the sides at shoulder height in the middle of a large backward circle, palms down, relaxed face. ${FRONT}` },
  { id: 'cat-cow', key: 'cat_cow',
    start: `Cat pose: on hands and knees on the floor, hands under the shoulders, knees under the hips, the back rounded strongly upward toward the ceiling, chin tucked to the chest. ${SIDE}`,
    end: `Cow pose: on hands and knees on the floor, hands under the shoulders, knees under the hips, the belly dropped so the back arches downward, chest pushed forward, head lifted and looking slightly up. ${SIDE}` },
  { id: 'open-book', key: 'open_book',
    start: `Open book thoracic rotation, start: lying on the left side on the floor, both knees bent to 90 degrees and stacked, both arms extended straight forward on the floor at shoulder height with the palms together. Camera at floor level from the front of the body.`,
    end: `Open book thoracic rotation, end: still lying with the knees stacked on the floor, the top (right) arm has swept in an arc over the body and now rests on the floor on the other side, the chest and head rotated to follow the hand, the lower arm stays on the floor in front. Camera at floor level from the front of the body.` },
  { id: 'thread-needle', key: 'thread_needle',
    start: `Thread the needle, start: on hands and knees, the right arm threaded under the body through the gap between the left arm and the left knee, the right shoulder and the right side of the head resting on the floor, palm up, the left hand stays on the floor. ${FRONT}`,
    end: `Thread the needle, end: on hands and knees with the left hand on the floor, the right arm extended straight up toward the ceiling, chest opened and rotated to the right, head turned to look up at the right hand. ${FRONT}` },
  { id: 'wall-slides', key: 'wall_slides',
    start: `Wall slides, start: standing with the back, head and glutes flat against ${WALL}, feet one foot-length in front of the wall, both forearms pressed against the wall with the elbows bent to 90 degrees at shoulder height, backs of the hands touching the wall. ${FRONT}`,
    end: `Wall slides, end: same position against the wall, both arms slid straight up overhead in a V, forearms and backs of the hands still touching the wall, ribs down, lower back close to the wall. ${FRONT}` },
  { id: 'shoulder-cars', key: 'shoulder_cars',
    start: `Shoulder controlled articular rotation: standing upright with the torso braced, the right arm fully straight and raised overhead at the top of a slow circle, fist loosely closed and the palm turned outward, the left arm relaxed at the side. ${FRONT}` },
  { id: 'hip-cars', key: 'hip_cars',
    start: `Hip controlled articular rotation: standing on the left leg next to ${RACK} with the left hand on the upright for balance, the right knee lifted and opened out to the side at hip height in the middle of a slow circle, foot relaxed, torso upright and still. ${FRONT}` },
  { id: 'leg-swings', key: 'leg_swings', single: true,
    start: `Leg swings: standing next to ${RACK} with one hand on the upright, swinging the straight right leg forward and up to hip height, toes pulled up, torso upright, standing leg slightly bent. ${SIDE_HIGH}` },
  { id: 'ankle-circles', key: 'ankle_circles', single: true,
    start: `Ankle circles: standing on the left leg with the right foot lifted a few centimetres off the floor, the right ankle rotating in a circle with the toes pointed, the left hand on ${WALL} for balance. ${SIDE_HIGH}` },
  { id: 'knee-wall-mob', key: 'knee_wall_mob', single: true,
    start: `Knee-to-wall ankle mobilisation: standing barefoot in a split stance facing ${WALL}, the front foot about a hand-width from the wall with the heel firmly on the floor, the front knee pushed forward until it touches the wall, hands resting on the wall, back leg straight behind. ${SIDE_HIGH}` },
  { id: 'ninety-ninety-switch', key: 'ninety_ninety_switch',
    start: `90/90 hip switch, start: sitting on the floor in the 90/90 position, the right leg bent 90 degrees in front of the body with the shin across, the left leg bent 90 degrees out to the side and behind, hands on the floor behind the hips, torso upright. ${FRONT}`,
    end: `90/90 hip switch, middle: sitting on the floor with the hands behind the hips, both knees lifted a few centimetres and swinging together toward the other side halfway through the switch, feet relaxed, torso upright. ${FRONT}` },
  { id: 'ninety-ninety-hold', key: 'ninety_ninety_hold', single: true,
    start: `90/90 hip stretch hold: sitting on the floor in the 90/90 position with the right leg bent in front and the left leg bent out to the side and behind, both sit bones down, torso upright and hinged slightly forward over the front shin with a straight back, hands resting lightly on the front shin. ${FRONT}` },
  { id: 'deep-squat-hold', key: 'deep_squat_hold', single: true,
    start: `Deep squat hold: full-depth squat with the feet slightly wider than hip-width and the toes turned slightly out, heels flat on the floor, hips below the knees, chest upright, holding ${KB} with both hands in front of the chest as a counterweight, elbows pressing the knees outward. ${FRONT}` },
  { id: 'calf-dyn', key: 'calf_dyn', single: true,
    start: `Downward-dog calf pedal: in an inverted V with the hands and feet on the floor and the hips high, the right heel pressed down to the floor with the right leg straight while the left knee is bent and the left heel lifted. ${SIDE}` },

  // ---------- Statisch ----------
  { id: 'couch-stretch', key: 'couch_stretch', single: true,
    start: `Couch stretch: kneeling with the back toward ${WALL}, the right knee on ${TOWEL} in the corner where the floor meets the wall, the right shin and foot running vertically up the wall, the left foot planted flat in front with the knee at 90 degrees, torso upright, glutes squeezed, hands resting on the front knee. ${SIDE_HIGH}` },
  { id: 'hip-flexor-kneel', key: 'hip_flexor_kneel', single: true,
    start: `Half-kneeling hip flexor stretch: the right knee on ${TOWEL} on the floor, the left foot planted flat in front with the knee at 90 degrees, hips pushed gently forward, torso upright, the right arm reaching straight up overhead, the left hand on the front thigh. ${SIDE_HIGH}` },
  { id: 'adductor-rock', key: 'adductor_rock', single: true,
    start: `Adductor rock-back stretch: on the left knee and both hands on the floor, the right leg extended straight out to the side with the foot flat and the toes pointing forward, the hips rocked back toward the left heel, back flat. ${FRONT}` },
  { id: 'figure-four', key: 'figure_four', single: true,
    start: `Supine figure-four stretch: lying on the back on the floor, the right ankle crossed over the left knee, both hands gripping behind the left thigh and pulling the left leg toward the chest, the right knee pushed gently outward, head relaxed on the floor. ${SIDE}` },
  { id: 'hamstring-stretch', key: 'hamstring_stretch', single: true,
    start: `Supine hamstring stretch: lying on the back on the floor with the left leg straight on the floor, the right leg raised straight toward the ceiling with ${TOWEL} looped around the foot and held with both hands, toes pulled toward the shin, head and hips on the floor. ${SIDE}` },
  { id: 'quad-stretch', key: 'quad_stretch', single: true,
    start: `Standing quadriceps stretch: standing on the left leg next to ${WALL} with the left hand on the wall for balance, the right foot pulled up behind toward the glutes and held by the right hand at the ankle, knees together, torso upright. ${SIDE_HIGH}` },
  { id: 'calf-wall', key: 'calf_wall', single: true,
    start: `Wall calf stretch: standing facing ${WALL} with both hands on the wall at shoulder height, the right leg stepped far back with the heel flat on the floor and the knee straight, the left leg bent in front, hips pushed toward the wall. ${SIDE_HIGH}` },
  { id: 'chest-doorway', key: 'chest_doorway', single: true,
    start: `Doorway chest stretch: standing in ${DOOR} with the right forearm and palm against the frame, the elbow slightly below shoulder height and bent to 90 degrees, one small step forward through the doorway so the chest opens, shoulder down and back, torso upright. ${FRONT}` },
  { id: 'sleeper-stretch', key: 'sleeper_stretch', single: true,
    start: `Sleeper stretch: lying on the right side on the floor, the right upper arm on the floor in front of the body at shoulder height with the elbow bent to 90 degrees, the left hand gently pressing the right forearm down toward the floor, head resting on the floor. Camera at floor level from the front of the body.` },
  { id: 'dead-hang', key: 'dead_hang', single: true,
    start: `Dead hang: hanging from the bar of ${RACK} with a shoulder-width overhand grip, arms fully straight, shoulders relaxed up toward the ears, body long and still, feet off the floor with the toes pointing down. ${FRONT}` },
  { id: 'puppy-pose', key: 'puppy_pose', single: true,
    start: `Puppy pose: kneeling with the hips stacked directly above the knees, both arms walked far forward on the floor and fully straight, chest sinking toward the floor, forehead resting on the floor. ${SIDE}` },
  { id: 'triceps-stretch', key: 'triceps_stretch', single: true,
    start: `Overhead triceps stretch: standing upright, the right arm raised overhead with the elbow bent so the right hand reaches down between the shoulder blades, the left hand on the right elbow gently pushing it back. ${FRONT}` },
  { id: 'biceps-wall', key: 'biceps_wall', single: true,
    start: `Wall biceps stretch: standing sideways next to ${WALL}, the right palm flat on the wall at shoulder height with the fingers pointing backward and the arm straight, the body turned slightly away from the wall so the biceps stretches. ${FRONT}` },
  { id: 'forearm-stretch', key: 'forearm_stretch', single: true,
    start: `Prayer forearm stretch: standing upright with the palms pressed together in front of the chest, fingers pointing up, elbows lifted out to the sides, the hands pushed slowly down toward the waist. ${FRONT}` },
  { id: 'cobra', key: 'cobra', single: true,
    start: `Cobra stretch: lying face-down on the floor, hands under the shoulders, arms pushed almost straight so the chest and head lift up while the pelvis stays on the floor, shoulders down away from the ears, looking straight ahead. ${SIDE}` },

  // ---------- Mobility-Check ----------
  { id: 'test-knee-wall', key: 'test_knee_wall', single: true,
    start: `Knee-to-wall test for ankle dorsiflexion: standing barefoot in a split stance facing ${WALL}, the front foot placed about 10 cm from the wall with the heel flat on the floor, the front knee pushed forward to touch the wall, hands on the wall, ${RULER} next to the front foot measuring the distance from the big toe to the wall. ${SIDE_HIGH}` },
  { id: 'test-sit-reach', key: 'test_sit_reach', single: true,
    start: `Sit-and-reach test: sitting on the floor with both legs straight and together and the bare soles of the feet flat against ${WALL}, reaching forward with both hands stacked toward the toes with a straight back, ${RULER} beside the legs. ${SIDE_HIGH}` },
  { id: 'test-overhead-reach', key: 'test_overhead_reach', single: true,
    start: `Supine overhead reach test: lying on the back on the floor with the knees bent and feet flat, the lower back pressed into the floor, the right arm fully straight and lowered overhead toward the floor with the thumb pointing up, the wrist a few centimetres above the floor, the left arm at the side. ${SIDE}` },
  { id: 'test-9090', key: 'test_9090', single: true,
    start: `90/90 hip rotation test: sitting on the floor in the 90/90 position with the right leg bent in front and the left leg bent out to the side and behind, torso fully upright with the hands not touching the floor, the back knee hovering a few centimetres above the floor, ${RULER} beside the back knee. ${FRONT}` },
]
