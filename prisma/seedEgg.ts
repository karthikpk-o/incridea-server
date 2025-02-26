import { PrismaClient } from "@prisma/client";
import { DayType } from "@prisma/client";
const db = new PrismaClient();

const main = async () => {
  try {
    console.log("Starting the seeding process...");
    await addClues();

    console.log("Seeding completed.");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    await db.$disconnect();
    console.log("Database connection closed.");
  }
};

const addClues = async () => {
    const clues = [
        { clue: "A place of waiting, a place of farewells, Where stories begin and memories dwell. Engines hum and footsteps blend, Here the journey finds its end. With routes that stretch both near and far.", day:DayType.Day1 },
        { clue: "I stand tall and red, where letters are fed, Messages travel, but I stay instead. Look behind, don’t be misled, For treasure awaits where footsteps tread.", day:DayType.Day1 },
        { clue: "A place of comfort, a feast to behold, Where stories are shared and laughter unfolds. Close to the greens where signals are strong, A haven for two, where hearts belong. With flavors so rich and a name well-known, Find where indulgence has proudly grown.", day:DayType.Day1 },
        { clue: "A space of logic, a thinker’s retreat, Where codes are cracked, and minds compete. Close to the challenge, yet quiet inside, A lab where knowledge and skill collide. In Visvesvaraya’s name, it proudly stands, Find this room where precision commands.", day:DayType.Day1 },
        { clue: "maze of silence where thoughts take form, Time-travelers dwell here, weathering each storm. What sanctuary holds the weight of centuries in stillness?", day:DayType.Day2 },
        { clue: "A mirror so wide, yet it moves with the breeze, A platform stands where you feel at ease. Look down below, the waters play, where you stand, a prize may lay.", day:DayType.Day2 },
        { clue: "A court of echoes, where sneakers squeak, Fast-paced battles, the strong and the sleek. With a golden post that stands so tall, A hoop that dares, a game for all. Dribble, pass, take your shot, Find this spot where legends are taught.", day:DayType.Day2 },
        { clue: "A master of craft, a visionary’s face, Honored with wisdom, in a rightful place. Not standing tall, yet watching near, A figure of brilliance we all revere. Find the bust where knowledge stays, And uncover the treasure that wisdom lays.", day:DayType.Day2 },
        { clue: "A place of strength, where goals are set, Sweat and will, no room for regret. Near the stage where music’s loud, And dance sets fire to the crowd. You’ve seen the moves, the energy high, Find where power and passion collide.", day: DayType.Day3 },
        { clue: "Near the feast, where aromas drift, Lies a stage where talents lift. A golden name, a shining mark, A home for dreams that leave a spark. From art to threads, from steps to show, Find where creativity loves to grow.", day: DayType.Day3 },
        { clue: "A store of needs, a student’s space, From sheets to ink, it sets the pace. Where essentials stack, from small to grand, And prints may test your patience’s stand. No food you'll find, but tools for the mind, Seek this hub, where supplies align.", day: DayType.Day3 },
        { clue: "I stand tall where knowledge flows, this is where You fly with the wings of fire On the fifth, where the curious go. I hold the news, the updates, the lore, Find me to unlock the score.", day: DayType.Day3 },
      ];

  await db.card.createMany({
    data: clues,
  });
};

await main();
