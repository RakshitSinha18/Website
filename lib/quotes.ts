export interface Quote {
  text: string
  author: string
}

/**
 * Quotes for the "quote of the day" engine. The Bruce Lee "be like water"
 * quote leads the set — it captures the philosophy of learning and adapting.
 */
export const QUOTES: Quote[] = [
  {
    text: "Be like water — empty your mind, be formless, shapeless. You put water into a cup, it becomes the cup; into a bottle, it becomes the bottle. Water can flow, or it can crash. Be water, my friend.",
    author: "Bruce Lee",
  },
  {
    text: "In data, as in water, the goal is to flow toward clarity — adapt to the shape of the question you're given.",
    author: "Rakshit Sinha",
  },
  {
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
  },
  {
    text: "Without data, you're just another person with an opinion.",
    author: "W. Edwards Deming",
  },
  {
    text: "Learning never exhausts the mind.",
    author: "Leonardo da Vinci",
  },
  {
    text: "Torture the data, and it will confess to anything.",
    author: "Ronald Coase",
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
  },
  {
    text: "It is a capital mistake to theorize before one has data.",
    author: "Arthur Conan Doyle",
  },
  {
    text: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    text: "Adapt what is useful, reject what is useless, and add what is specifically your own.",
    author: "Bruce Lee",
  },
]

/**
 * Deterministic "quote of the day" — everyone sees the same quote on a given
 * day, and it advances each day through the list.
 */
export function quoteOfTheDay(date = new Date()): Quote {
  const dayIndex = Math.floor(date.getTime() / 86_400_000) // days since epoch
  return QUOTES[dayIndex % QUOTES.length]
}
