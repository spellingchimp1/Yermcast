const FAKE_FACTS = [
  "In 1987, a light drizzle in Topeka, Kansas was so boring it caused 14 people to switch careers on the spot. The drizzle has never apologized.",
  "On this day in 1952, a fog so thick settled over London that a man walked into his own house by accident and didn't notice for three days. His wife noticed on day two but said nothing.",
  "In 1974, a tornado in Oklahoma picked up an entire Denny's and set it down two miles away. The Grand Slams were still warm. The waitress was still rude.",
  "Today in 1961, a snowstorm in Vermont was so quiet that 200 residents simultaneously decided to write poetry. A panel of experts later reviewed it and asked everyone to stop.",
  "In 1999, a heat wave in Phoenix was so intense that a man tried to fry an egg on the sidewalk. It worked. A pigeon stole it. The man never recovered emotionally.",
  "On this day in 1883, a thunderstorm in Ohio startled a farmer named Gerald so badly that he invented the scarecrow. He named it Gerald Jr. Gerald Jr. did not scare crows.",
  "In 2003, a light breeze in Nebraska rearranged the letters on a church sign to read 'GOD HATES WIND.' The pastor called it a sign. He was not wrong.",
  "Today in 1966, a hailstorm interrupted an outdoor chess tournament in Iowa. All 12 players called it a draw and went home. Three of them had already been losing badly and were relieved.",
  "In 1978, a blizzard in Chicago was so severe that 40,000 residents canceled plans they weren't going to keep anyway. It was the happiest day of the decade.",
  "On this day in 1945, a rainbow appeared over New Jersey that was so underwhelming it was described in the local paper as 'present.'",
  "In 2011, a hurricane off the Gulf Coast was so well-organized that meteorologists gave it five stars on Yelp. One reviewer said the storm surge was 'immersive.'",
  "Today in 1832, Benjamin Franklin's cousin tried to recreate the kite-in-lightning experiment on a clear sunny day. Nothing happened. He tried again every week for three years. Still nothing. He blamed the kite.",
  "In 1994, a wind gust in North Carolina blew a man's toupee onto a passing duck. The duck wore it confidently for 200 yards before releasing it into a pond.",
  "On this day in 1956, a particularly smug cold front swept through the Midwest, dropped temperatures 30 degrees, ruined one wedding, and left without explaining itself.",
  "In 2007, a scientist in Colorado recorded the most statistically average weather day in history. He stared out the window for a long time and then went home early.",
  "Today in 1921, a flash flood in Missouri washed away an entire town's to-do lists. Residents unanimously agreed it was the most productive thing the weather had ever done for them.",
  "In 1988, a lightning bolt struck a golf course in Florida and improved a man's handicap by four strokes. He was immediately disqualified. He sued the lightning. He lost.",
  "On this day in 1903, a fog bank rolled into San Francisco so dense that the city briefly became 11% more mysterious and 40% harder to get an Uber in.",
  "In 2015, a high pressure system over Texas became so powerful and confident it inspired three self-help books, a podcast, and one very aggressive LinkedIn post.",
  "Today in 1971, an ice storm coated a Minneapolis suburb in a thin layer of ice. One man attempted to skate to work. He made it. His coworkers never let it go.",
  "In 1963, a heat wave in Death Valley was so extreme that a rattlesnake voluntarily relocated to Michigan. It described Michigan as 'not ideal but survivable.'",
  "On this day in 1947, a gentle spring rain in Georgia was so pleasant that six people wrote heartfelt letters to their enemies calling a truce. Five were ignored. One led to a marriage.",
  "In 2009, a Category 3 hurricane bypassed Florida entirely and made landfall in Cuba, where it was reviewed by locals as 'acceptable, nothing to get worked up about.'",
  "Today in 1840, a tornado in Missouri picked up an entire courthouse, spun it 90 degrees, and set it back down. Court was still in session. The judge made no note of it in the record.",
  "In 1982, an unusually warm February in Vermont caused three bears to emerge from hibernation six weeks early. They stood around for a bit, realized nothing was ready, and went back to bed.",
  "On this day in 1958, a thunderstorm knocked power out across Rhode Island for six hours. Residents read books by candlelight and swore they'd do it again sometime. They have not.",
  "In 2001, a freak snowstorm hit Dallas in July. Meteorologists called it 'impossible.' A local TV anchor called it 'a liberal hoax.' The snow fell anyway and did not comment.",
  "Today in 1914, a European weather forecaster confidently predicted 'continued mild conditions through the fall.' It remains the most incorrect forecast in recorded history.",
  "In 1976, a strongly-worded wind advisory in Oregon was so stern that the wind slowed to a light breeze out of what scientists describe as 'something like shame.'",
  "On this day in 1999, a humidity sensor in Houston recorded 110%. Scientists called it a malfunction. Houston said it felt like an undercount.",
  "In 2004, a meteorologist in Nebraska predicted a 20% chance of rain. It did not rain. He celebrated. His coworkers did not understand why. He tried to explain probability. They stared at him.",
  "Today in 1968, a Santa Ana wind event in Los Angeles was so dry it caused three separate people to spontaneously begin complaining about their sinuses for the first time in their lives.",
  "In 1991, a blizzard in upstate New York dropped 4 feet of snow overnight. School was canceled. Children rejoiced. Parents stared into the middle distance.",
  "On this day in 1977, a warm spell in Alaska lasted two full days. Locals called it 'the good weeks.' It is still discussed with reverence.",
  "In 2012, a derecho — a long line of severe thunderstorms — crossed seven states in one afternoon. Most people Googled 'derecho' the next morning. Most still can't spell it.",
];

export default function WeatherHistory() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const fact = FAKE_FACTS[dayOfYear % FAKE_FACTS.length];

  return (
    <div className="section">
      <h2 className="section-title">Today in Weather History</h2>
      <div className="history-card">
        <p className="history-text">{fact}</p>
      </div>
    </div>
  );
}
