// Spezifikation der KI-Bilder je Übung (Übungs-ID → Dateibasis, Prompts, Posenreferenzen).
// make.mjs erzeugt daraus die Job-Dateien; Stil und Person kommen aus den bereits fertigen Bildern.
export const MODEL = 'gpt-image-2-image-to-image'
export const STYLE_REFS = [
  'https://rene-777.github.io/Fitnessapp/img/gen/pushup_start.webp',
  'https://rene-777.github.io/Fitnessapp/img/gen/pushup_end.webp',
  'https://rene-777.github.io/Fitnessapp/img/bioforce/bf002_start.webp',
]
export const STYLE =
  'Black-and-white studio instruction photo for a home-gym exercise manual, in exactly the style of the reference photos: the same man (short dark hair, clean-shaven, black sleeveless shirt, grey athletic shorts, white running shoes), plain light-grey seamless backdrop and light-grey floor, soft even studio lighting, slightly grainy monochrome print look, full body visible, nothing cropped, portrait format. No text, no watermark, no border, no logos, no mat.'
const DIPBARS = 'two separate free-standing black steel dip bars (each an inverted U with a foam-padded top handle about 90 cm high, standing parallel about shoulder-width apart, joined at floor level)'
const RACK = 'a free-standing black steel pull-up rack (two vertical uprights on an H-shaped floor base, horizontal bar on top at about 190 cm)'
const PARALLETTES = 'a pair of low wooden parallettes (beech-wood handles about 12 cm high on black steel legs) on the floor'
const BOX = 'a sturdy black plyo box about 50 cm high'
const KB = 'an 8 kg cast-iron kettlebell'
const SIDE = 'Camera at floor level from the side, athlete facing to the right of the frame.'
const FRONT = 'Camera at chest height from a front three-quarter angle.'

export const EXERCISES = [
  { id: 'pushup-defizit', key: 'pushup_defizit',
    start: `Top position of a deficit push-up on ${PARALLETTES}: hands gripping the wooden handles with palms facing each other, arms fully extended, body a straight line from head to heels, toes on the floor. ${SIDE}`,
    end: `Bottom position of the deficit push-up: elbows bent and tucked, chest lowered below the level of the wooden handles, between the parallettes, body still a straight line from head to heels, toes on the floor. ${SIDE}` },
  { id: 'plyo-pushup', key: 'plyo_pushup',
    start: `Bottom position of a push-up on the floor: hands on the floor slightly wider than the shoulders, elbows bent, chest just above the floor, body a straight line from head to heels, toes on the floor. ${SIDE}`,
    end: `Explosive plyometric push-up at the top of the movement: the push was so powerful that both hands have left the floor and hover about 10 cm in the air, arms extended, body a straight line from head to heels, toes still on the floor. ${SIDE}` },
  { id: 'dips', key: 'dips', poseStart: 'goliaz_3', poseEnd: 'goliaz_4',
    start: `Support hold at the top of a dip on ${DIPBARS}: hands gripping one handle each, arms fully straight, shoulders down, torso upright, knees bent with feet crossed behind him, feet off the floor. ${FRONT}`,
    end: `Bottom position of the dip on the same dip bars: elbows bent to 90 degrees, torso leaning slightly forward, shoulders just above the hands, knees bent with feet crossed behind him, feet off the floor. ${FRONT}` },
  { id: 'pullup', key: 'pullup', poseStart: 'goliaz_6', poseEnd: 'goliaz_7',
    start: `Dead hang at the start of a pull-up on ${RACK}: overhand grip slightly wider than the shoulders, arms fully straight, feet off the floor, knees slightly bent and ankles crossed. ${FRONT}`,
    end: `Top position of the pull-up on the same rack: chin above the bar, elbows pulled down and back, chest toward the bar, feet off the floor, knees slightly bent and ankles crossed. ${FRONT}` },
  { id: 'australian-pullup', key: 'australian_pullup',
    start: `Start of an Australian pull-up (inverted row) beneath ${DIPBARS}: he lies face-up under the bars gripping one handle in each hand with palms facing each other, heels on the floor, legs straight, arms fully straight, body a straight line from shoulders to heels, back a few centimetres above the floor. ${SIDE}`,
    end: `Top of the Australian pull-up: chest pulled up to the handles, elbows bent and close to the body, shoulder blades squeezed together, body still a straight line from shoulders to heels, heels on the floor. ${SIDE}` },
  { id: 'scapula-pushup', key: 'scapula_pushup',
    start: `Scapula push-up, start: high plank with hands on the floor under the shoulders, arms straight and locked, shoulder blades spread apart so the upper back is rounded and pushed up toward the ceiling, body straight from head to heels. ${SIDE}`,
    end: `Scapula push-up, end: same high plank with arms still straight and locked, but the shoulder blades are squeezed together so the chest sinks down between the shoulders, body straight from head to heels. ${SIDE}` },
  { id: 'scapula-pullup', key: 'scapula_pullup', poseStart: 'goliaz_6',
    start: `Scapula pull-up, start: dead hang from ${RACK} with an overhand grip, arms fully straight, shoulders relaxed and pulled up toward the ears, feet off the floor, ankles crossed. ${FRONT}`,
    end: `Scapula pull-up, end: still hanging with arms fully straight, but the shoulder blades are pulled down and back so the body has risen a few centimetres and the neck looks longer, feet off the floor, ankles crossed. ${FRONT}` },
  { id: 'step-up', key: 'step_up',
    start: `Step-up, start: standing in front of ${BOX}, the left foot placed fully on top of the box, the right foot on the floor, holding ${KB} with both hands in front of the chest, torso upright. ${SIDE}`,
    end: `Step-up, end: standing tall on top of the same box on both feet, knees straight, holding the kettlebell with both hands in front of the chest, torso upright. ${SIDE}` },
  { id: 'wall-sit', key: 'wall_sit', single: true,
    start: `Wall sit: back and shoulders flat against a plain light-grey wall, thighs parallel to the floor, knees bent at 90 degrees directly above the ankles, feet flat on the floor, arms crossed in front of the chest. ${SIDE}` },
  { id: 'kniebeuge-bw', key: 'kniebeuge_bw',
    start: `Bodyweight squat, start: standing upright with feet shoulder-width apart, arms extended straight forward at shoulder height, chest up. ${SIDE}`,
    end: `Bodyweight squat, bottom: hips lowered until the thighs are parallel to the floor, knees over the toes, heels flat on the floor, chest up, back straight, arms extended straight forward at shoulder height. ${SIDE}` },
  { id: 'kb-swing', key: 'kb_swing',
    start: `Kettlebell swing, start: hip hinge with the back flat, knees slightly bent, ${KB} held with both hands and swung back between the legs, arms straight, eyes forward. ${SIDE}`,
    end: `Kettlebell swing, top: standing tall with hips fully extended, glutes squeezed, arms straight and the kettlebell swung up to chest height in front of him. ${SIDE}` },
  { id: 'superman', key: 'superman',
    start: `Superman exercise, start: lying face-down flat on the floor, arms extended straight forward on the floor, legs straight, forehead near the floor. ${SIDE}`,
    end: `Superman exercise, top: lying face-down, chest, straight arms and straight legs lifted off the floor at the same time, only the hips and belly touch the floor, eyes looking at the floor. ${SIDE}` },
  { id: 'side-plank', key: 'side_plank', single: true,
    start: 'Side plank: lying on the right side propped on the right forearm with the elbow directly under the shoulder, feet stacked, hips lifted so the body forms a straight line from head to feet, left arm resting on the hip. Camera at floor level from the front of the body, face toward the camera.' },
  { id: 'hanging-knee-raise', key: 'hanging_knee_raise', poseStart: 'goliaz_6',
    start: `Hanging knee raise, start: dead hang from ${RACK} with an overhand grip, arms straight, legs straight and hanging down, feet off the floor. ${FRONT}`,
    end: `Hanging knee raise, top: still hanging with straight arms, both knees pulled up to chest height, pelvis tucked slightly, feet off the floor. ${FRONT}` },
  { id: 'dead-bug', key: 'dead_bug',
    start: `Dead bug, start: lying on the back on the floor, both arms extended straight up toward the ceiling, hips and knees bent at 90 degrees so the shins are parallel to the floor, lower back pressed into the floor. ${SIDE}`,
    end: `Dead bug, end: lying on the back, the right arm extended overhead just above the floor and the left leg extended straight just above the floor, while the left arm points to the ceiling and the right knee stays bent at 90 degrees, lower back pressed into the floor. ${SIDE}` },
  { id: 'mountain-climber', key: 'mountain_climber',
    start: `Mountain climbers, start: high plank with hands on the floor under the shoulders, arms straight, body a straight line from head to heels, toes on the floor. ${SIDE}`,
    end: `Mountain climbers: high plank with arms straight, the right knee driven forward toward the chest with the right foot off the floor, the left leg extended back, hips level. ${SIDE}` },
  { id: 'burpee', key: 'burpee', poseStart: 'goliaz_2', poseEnd: 'goliaz_9',
    start: `Burpee, start: standing upright and relaxed with feet hip-width apart, arms hanging at the sides, looking straight ahead. ${FRONT}`,
    end: `Burpee, jump: he is in the air at the top of a vertical jump, both feet clearly off the floor, legs straight, body fully extended in a straight line, both hands touching each other behind the head with elbows out. ${FRONT}` },
]
