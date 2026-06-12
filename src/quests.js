// Quest chain in the classic style: boars, wolves, a boss — then bandits, their
// king, and finally an endless bounty board for the long evenings.

import { makeUnique } from './items.js';   // for quests that hand over a named unique (Greta's coda)

const QUESTS = [
  {
    id: 'boars',
    name: 'Boar Trouble',
    targetKind: 'boar', count: 6,
    intro: `Ah, a fresh face! Welcome to the Howling Plains, adventurer. The young boars have grown bold — they've torn up our seed stores twice this week. Thin their numbers, would you? Six should send the message.`,
    outro: `Ha! I can hear the plains breathing easier already. Here — you've earned this.`,
    rewardXp: 80, rewardGold: 50,
  },
  {
    id: 'wolves',
    name: 'Fangs of the Forest',
    targetKind: 'wolf', count: 4,
    intro: `With the boars scattered, something worse creeps in: forest wolves, down from the tree line. They stalk anyone who strays from the path. Put down four of the beasts — and watch your back out there.`,
    outro: `Four wolves! And barely a scratch on you. The pioneers will sleep sound tonight.`,
    rewardXp: 120, rewardGold: 90,
  },
  {
    id: 'boss',
    name: 'The Ravager',
    targetKind: 'boss', count: 1,
    intro: `There's a reason the boars fled toward our camp. An old terror has woken in the eastern hollow — the trappers call him BODO THE RAVAGER. Tusks like scythes. Follow the east path to its end… and end HIM. Goddess watch over you.`,
    outro: `By the Goddess… you actually did it. Bodo the Ravager, felled! Your name will be sung in Varanas, friend. Take this — runes of the old world. You've more than earned them.`,
    rewardXp: 200, rewardGold: 250, rewardRunes: 3,
  },
  {
    id: 'bandits',
    name: 'Red Cloaks on the Ridge',
    targetKind: 'bandit', count: 6,
    intro: `Word of Bodo's fall has spread — and drawn vultures of the two-legged kind. Grimblade bandits have raised tents on the northwest ridge, and our supply runners come back robbed or not at all. Follow the west path. Six of those red cloaks in the dirt should loosen their nerve.`,
    outro: `Six Grimblades down! The runners came through untouched this morning — first time in weeks. You're worth ten of us, friend.`,
    rewardXp: 250, rewardGold: 220,
  },
  {
    id: 'banditking',
    name: 'The Bandit King',
    targetKind: 'banditking', count: 1,
    intro: `The bandits don't scatter because they fear something worse than us: RURIK THE RED, the self-crowned king of the ridge. They say his blade has never been lifted in a fair fight — so don't give him one. Cut the head off the Grimblades, and the plains are truly free.`,
    outro: `Rurik the Red, dead by your hand… The Grimblades are already melting into the hills. Whatever roads you walk next, adventurer, the Howling Plains will remember your name. Take these runes — a king's ransom.`,
    rewardXp: 400, rewardGold: 450, rewardRunes: 3,
  },
  {
    id: 'korgrim',
    name: 'Trial I: The Mountain That Walks',
    targetKind: 'korgrim', count: 1, trial: true,
    intro: `You've outgrown the plains, hero — so hear an old story. Three terrors were bound at the valley's edges by the sentinel stones, and the stones are failing. The first: KORGRIM THE MOUNTAIN, a giant on the northern rim. Steel barely dents him, and when he raises his fists, the very earth shatters — JUMP the moment he does, or be broken. Stock up on draughts first. I mean it.`,
    outro: `The ground stopped trembling an hour ago — that was YOU? Korgrim the Mountain, toppled! The stones can rest… two more cannot.`,
    rewardXp: 1500, rewardGold: 1200, rewardRunes: 4,
  },
  {
    id: 'vexnar',
    name: 'Trial II: Ash on the Wind',
    targetKind: 'vexnar', count: 1, trial: true,
    intro: `The second terror nests on the eastern rim: VEXNAR THE ASH DRAGON. The trappers who've seen her and lived all say the same thing — when she draws breath, the ground beneath you glows. Do not be standing there when she finishes. RUN from the mark, every single time.`,
    outro: `Ash on the wind, and the dragon's shadow gone from the rim… You are no adventurer anymore, friend. You are a legend with muddy boots.`,
    rewardXp: 2500, rewardGold: 2000, rewardRunes: 6,
  },
  {
    id: 'morgrath',
    name: 'Trial III: The Pale King',
    targetKind: 'morgrath', count: 1, trial: true,
    intro: `The last and worst waits in the southwest: MORGRATH, THE PALE KING. Dead a thousand years and angry about all of them. He tears the earth open beneath your feet — move! — and worse: every wound you deal him, he answers by raising the dead to his side. Cut the thralls down fast, or drown in them. Goddess keep you. The plains will be watching.`,
    outro: `The Pale King… unkinged. I have no words, and Barnaby ALWAYS has words. The Trials are done, the stones stand quiet, and Taborea owes you a debt it cannot count. The bounty board is yours forever, hero.`,
    rewardXp: 4000, rewardGold: 3500, rewardRunes: 10,
  },
  {
    id: 'ossus',
    name: 'The Sunken Crypt',
    targetKind: 'ossus', count: 1, trial: true,
    intro: `When Morgrath fell, something beneath the old hill northwest of camp… woke up. The diggers found an archway down there — older than the sentinel stones, older than Taborea maybe — and none who entered came back out. They speak a name in their sleep, the ones who camped too close: OSSUS. Take the stair beneath the arch, hero. Mind the dead — they walk in packs down there, and the walls give no room to run.`,
    outro: `The Gravelord, dust at last! But the diggers say the deepest door is still shut, and behind it something old keeps NOT dying. One more descent, hero. The last one.`,
    rewardXp: 1400, rewardGold: 5000, rewardRunes: 8,
  },
  {
    id: 'vargoth',
    name: 'The Undying',
    targetKind: 'vargoth', count: 1, trial: true,
    intro: `VARGOTH THE UNDYING. Morgrath's master, the first necromancer, the reason the crypt was sunk and sealed. He sits a throne at the bottom of the dark and he has had a thousand years to get angry. He breaks the floor — jump it. He curses the ground — leave it. He raises his guard — cut them down before they cut you. No hero has ever needed all three lessons at once. You will. Goddess go with you, because I certainly won't.`,
    outro: `…You're standing here. Which means the Undying isn't. THE UNDYING ISN'T! Hero, when they sing of Taborea a hundred years from now, the song will be about YOU. The crypt is yours to plunder, the plains are yours to guard, and my fire is yours forever.`,
    rewardXp: 2500, rewardGold: 10000, rewardRunes: 15,
  },
];

const BOUNTY = {
  name: "Pioneer's Bounty",
  count: 10,
  intro: `The plains are safe — but never tame. The pioneers post a standing bounty: any ten beasts or brigands culled, and the coin is yours. Come back whenever the pouch feels light, hero. There's always work.`,
  outro: `Ten more pests off the plains. The bounty stands, as always — coin for claws.`,
};

// the bounty pays by reputation — it scales with your level
function bountyXp(game) { return Math.max(150, game.player.level * 20); }
function bountyGold(game) { return Math.max(100, game.player.level * 15); }

// ===== The Ashen Highlands — a sibling chain offered by Emberwarden Kaska =====
// Lives alongside Barnaby's (finished) chain. Same machinery, its own quests,
// bounty, NPC, and a zone-gated bounty count (so plains kills don't fill it).
const HIGHLAND_QUESTS = [
  { id: 'h_cinders', name: 'Cinders on the Wind', targetKind: 'cinderwraith', count: 6, trial: false,
    intro: `So you walked through the pass. Few do, and fewer walk back. I am Kaska, Emberwarden — what's left of the watch. The cinder-dead drift the plateau and burn what they touch. Put six of the wraiths out.`,
    outro: `Six wraiths snuffed. The ash settles a little. Take this — you'll want it for what's ahead.`,
    rewardXp: 1800, rewardGold: 1200 },
  { id: 'h_packs', name: 'The Hungry Dark', targetKind: 'ashhound', count: 8, trial: false,
    intro: `The hounds hunt in packs and run faster than you'd credit. They've pulled down two of my watchers this month. Thin them — eight should make the rest cautious.`,
    outro: `Eight hounds. The plateau's quieter than it's been in a season.`,
    rewardXp: 2500, rewardGold: 1500 },
  { id: 'h_emberlord', name: 'The Emberlord', targetKind: 'emberlord', count: 1, trial: true,
    intro: `In the north basin a thing crowned in fire calls the hounds to heel: EMBERLORD VSSARIC. He rains meteors and raises the dead pack when he bleeds. End him, and only the Wyrm will remain.`,
    outro: `Vssaric, cold at last. Only Pyraxis now — and the Goddess help you there.`,
    rewardXp: 5000, rewardGold: 5000, rewardRunes: 8 },
  { id: 'h_pyraxis', name: 'Pyraxis, the Cinder Wyrm', targetKind: 'pyraxis', count: 1, trial: true,
    intro: `PYRAXIS. The Cinder Wyrm. The reason the watch is one old woman and a signpost. She crashes down — jump it. She breathes — move from it. She spits clinging fire that stays and stays — never stand in it, and never stop moving. No one has done all of it at once. Be the first.`,
    outro: `…You are still breathing, and the Wyrm is not. The Highlands are yours, Emberwarden. The fire is yours forever.`,
    rewardXp: 10000, rewardGold: 18000, rewardRunes: 20 },
];

const HIGHLAND_BOUNTY = {
  name: "Emberwarden's Bounty", count: 12,
  intro: `The plateau never empties, hero. Cull any twelve of its creatures and the watch's coin is yours — as long as it lasts.`,
  outro: `Twelve fewer things that burn. The bounty stands.`,
};
function hBountyXp(game) { return Math.max(2000, game.player.level * 45); }
function hBountyGold(game) { return Math.max(900, game.player.level * 45); }

// the Highlands creatures — so each bounty only counts its own zone's kills
const HIGHLAND_KINDS = new Set(['cinderwraith', 'ashhound', 'obsidiangolem', 'emberlord', 'pyraxis']);
// the Frostveil and the Starfall Sanctum families — same zone-gated bounty trick
const FROSTVEIL_KINDS = new Set(['hoarfrostserpent', 'frostfangstalker', 'rimeboundsentinel', 'hrimnir']);
const SANCTUM_KINDS = new Set(['custodian', 'seraphel', 'noctyra']);
// the Verdant Hollow family — five culls (NOT Vorthal; the world boss is no
// bounty fodder). Greta's standing order counts these; Barnaby's never does.
const HOLLOW_KINDS = new Set(['sporecaller', 'hollowstalker', 'bloomwarden', 'swarmling', 'spireshade']);
// the Horologium family — the dungeon trash (NOT the three clockwork bosses).
// Tamsin's standing order counts these two; Barnaby's never does.
const HOROLOGIUM_KINDS = new Set(['cogwraith', 'sandflayer']);

export function createQuests() {
  return makeChain({
    quests: QUESTS, bounty: BOUNTY, bountyXp, bountyGold,
    npcName: 'Pioneer Barnaby',
    // Barnaby's bounty counts anything EXCEPT the gated zones' creatures
    // (thunderbristle is in no set, so it still counts for Barnaby — as intended)
    bountyCounts: (enemy) =>
      !HIGHLAND_KINDS.has(enemy.kind) && !FROSTVEIL_KINDS.has(enemy.kind) &&
      !SANCTUM_KINDS.has(enemy.kind) && !HOLLOW_KINDS.has(enemy.kind) &&
      !HOROLOGIUM_KINDS.has(enemy.kind),
    vendor: true,    // Barnaby sells wares + buys loot
  });
}

export function createHighlandQuests() {
  return makeChain({
    quests: HIGHLAND_QUESTS, bounty: HIGHLAND_BOUNTY, bountyXp: hBountyXp, bountyGold: hBountyGold,
    npcName: 'Emberwarden Kaska',
    bountyCounts: (enemy) => HIGHLAND_KINDS.has(enemy.kind),
    vendor: false,   // Kaska is no vendor
  });
}

// ===== The Frostveil — Surveyor Odda's chain (post-Pyraxis bridge, L82–92) =====
// A retired cartographer mapping the polar vale, one murdered measuring chain at
// a time. Three culls (one per trash family), the Avalanche-Jarl, then the door
// she very much did not want anyone to open. Her own zone-gated bounty.
const FROSTVEIL_QUESTS = [
  { id: 'z_serpents', name: 'Six Straight Lines', targetKind: 'hoarfrostserpent', count: 6, trial: false,
    intro: `You're the one from the valley? Good. I'm Odda — Royal Surveyor, twice retired, and the only soul fool enough to map the Frostveil. I'd have finished weeks ago, but the Hoarfrost Serpents keep eating my measuring chains. And my assistants. Mostly the chains, in fairness. They spit winter, hero — put six of them down so an honest woman can draw a straight line.`,
    outro: `Six! And my last chain returned — partially. The map gains an inch. Keep that sword out, hero. The inch after this one is worse.`,
    rewardXp: 4100, rewardGold: 3500 },
  { id: 'z_stalkers', name: 'A Territorial Insult', targetKind: 'frostfangstalker', count: 8, trial: false,
    intro: `New problem. The Frostfang Stalkers have found my survey flags and decided they're a territorial insult. They may be right. White coats on white snow, hunting in threes, and you hear them AFTER. Eight of them gone, or this map gets labeled "approximately fatal" and the cartographers' guild revokes my pension a third time.`,
    outro: `Eight, and the flags still standing! The guild will hate this map — accurate AND survivable. You're ruining my reputation, hero. Do continue.`,
    rewardXp: 4600, rewardGold: 4000 },
  { id: 'z_sentinels', name: 'Five Fixed Points', targetKind: 'rimeboundsentinel', count: 5, trial: false,
    intro: `Next item. My triangulation needs five fixed points on the western moraine, and all five are currently occupied by Rimebound Sentinels — the vale's old watchers, frozen mid-stride and woken up WRONG. They stand exactly where my markers go, and they do not respond to paperwork. Steel skips off the ice on them, so don't fence — hammer. Five, please. The map thanks you in advance.`,
    outro: `Five sentinels down and my markers planted in what's left of them. Grim? Accurate. That's cartography.`,
    rewardXp: 4900, rewardGold: 4500 },
  { id: 'z_hrimnir', name: 'The Hole in the Map', targetKind: 'hrimnir', count: 1, trial: true,
    intro: `I'll say this plainly, because the alternative is screaming. Everything in the Frostveil answers to one thing: HRIMNIR, the Avalanche-Jarl, up on the western knoll. I watched him from a sensible distance and concluded there is no sensible distance — when he heaves his arms, the whole glacier comes down the hill like a wave. JUMP it. Every single time. And when he bleeds he whistles up the white hunt, so cut the wolves down first. He is the reason my map has a hole in the middle shaped like the word NO. Close it.`,
    outro: `Hrimnir, struck from the map — or rather onto it, as a small decorative skull. The highest honor cartography offers. …Hero. Look at the tarn. The crack in the ice is GLOWING. I measured it twice and the second measurement was deeper. Take these runes, and stop standing next to me.`,
    rewardXp: 9000, rewardGold: 9000, rewardRunes: 10 },
  { id: 'z_descent', name: 'Door, Do Not', targetKind: 'custodian', count: 3, trial: true,
    intro: `With the Jarl gone I finally measured the middle of the Frostveil — and the middle of the Frostveil is a DOOR. A star-shaped fissure, straight through the tarn ice, older than the Goddess's calendar and now standing open, which I want noted is not my fault. Go down, come back alive, and bring proof: three of whatever walks those halls in the dark. I'll be up here. Drawing. Rapidly.`,
    outro: `You went IN? I wrote "door, do not" on the map and you read "door, do"! …Well. Three of the dark's own, slain and certified. There's a scholar camped by the fissure now — Fenwick. He squealed about your vault louder than the vault did. Go see him before he combusts.`,
    rewardXp: 4600, rewardGold: 5000 },
];

const FROSTVEIL_BOUNTY = {
  name: "Surveyor's Commission", count: 12,
  intro: `The survey never ends, hero — the Frostveil un-maps itself nightly. A standing commission: any twelve of its creatures, and the guild's coin is yours. They budget for it now. I told them to.`,
  outro: `Twelve fewer obstructions to accurate cartography. The commission stands.`,
};
function fvBountyXp(game) { return Math.max(4500, game.player.level * 60); }
function fvBountyGold(game) { return Math.max(4500, game.player.level * 60); }

export function createFrostveilQuests() {
  return makeChain({
    quests: FROSTVEIL_QUESTS, bounty: FROSTVEIL_BOUNTY, bountyXp: fvBountyXp, bountyGold: fvBountyGold,
    npcName: 'Surveyor Odda',
    bountyCounts: (enemy) => FROSTVEIL_KINDS.has(enemy.kind),
    vendor: false,   // Odda surveys, she does not sell
  });
}

// ===== The Starfall Sanctum — Archivist Fenwick's chain (capstone, L96–105) =====
// A royal scholar narrating his own near-death from behind a very safe rock. Eight
// custodians, the Vault Warden, then the Hollow Star at the bottom of the bottom —
// and a renewable bounty for the appendix.
const SANCTUM_QUESTS = [
  { id: 'd_cull', name: 'Volume One', targetKind: 'custodian', count: 8, trial: false,
    intro: `STOP — don't touch the fissure-rim, the fissure-rim is ORIGINAL. Fenwick, Royal Archivist, at your service — well, at my own service, but you're invited. This vault predates every record I own, hero, and I own ALL of them. The halls below crawl with Astral Custodians — all gold and patience, a thousand years of dusting, and they do NOT want visitors. Clear me eight, and narrate as you go. Loudly. I'll be behind this very safe rock.`,
    outro: `Eight! I heard everything and wrote down most of it. My monograph has a title already: "Things That Should Have Stayed Asleep, Volume One." There will be volumes, hero. Oh yes.`,
    rewardXp: 5800, rewardGold: 7000 },
  { id: 'd_mid', name: 'Mid-Sentence', targetKind: 'seraphel', count: 1, trial: true,
    intro: `My notes have hit a snag, and the snag is the size of a chapel. The keeper of the inner gate — SERAPHEL, the Vault Warden — has polished that orrery for a thousand years, and every record of it ends mid-sentence. I find that thematically concerning. It lances starlight at the very tiles you stand on — MOVE, then keep moving. And it drags the whole orrery down on its own head — JUMP the ring of falling brass. A tidy creature. Be untidy at it, hero, and finish a sentence for me.`,
    outro: `Seraphel, annotated and DECEASED — the finest kind of primary source! The inner gate stands open. I would go first, but the footnotes need me alive.`,
    rewardXp: 11400, rewardGold: 15000, rewardRunes: 12 },
  { id: 'd_final', name: 'The Final Page', targetKind: 'noctyra', count: 1, trial: true,
    intro: `This is it. The bottom of the bottom. Every book I own points one direction and then stops dead: NOCTYRA, THE HOLLOW STAR. She fell the night the Wyrm died, hero, and the vale froze around her grief. Now the lessons — write them on your arm. She lets her weight come down: JUMP it. She tears rifts that stay and hunger: MOVE, and never stand back in them. She calls her keepers: cut them down fast. And when she drinks every light in the hall into her own shadow, the ONLY safe place in creation IS that shadow — GET IN, hero. Run INTO the dark when every bone says run away. That is the last lesson Taborea has to teach. Go and pass it. I'll be at the threshold, trembling, with the good ink.`,
    outro: `…The dark feels lighter. You did it. NOCTYRA — concluded. The aurora is dancing over the tarn; Odda says it hasn't danced since the night the star fell. Hero, my monograph just became a HISTORY, and you are its entire final chapter. Taborea has a roof again — and runes for its roofer. Spend them gloriously.`,
    rewardXp: 21000, rewardGold: 30000, rewardRunes: 25 },
];

const SANCTUM_BOUNTY = {
  name: 'Renewable Archive', count: 10,
  intro: `Ongoing fieldwork! The halls below re-fill — scholarship calls it "a renewable archive," everyone else calls it "monsters." Ten specimens culled per expedition, paid from the guild's deepest purse. For science, hero. For VOLUMES.`,
  outro: `Ten more entries for the appendix. The archive replenishes — appallingly. The commission stands.`,
};
function snBountyXp(game) { return Math.max(7000, game.player.level * 80); }
function snBountyGold(game) { return Math.max(7000, game.player.level * 80); }

export function createSanctumQuests() {
  return makeChain({
    quests: SANCTUM_QUESTS, bounty: SANCTUM_BOUNTY, bountyXp: snBountyXp, bountyGold: snBountyGold,
    npcName: 'Archivist Fenwick',
    bountyCounts: (enemy) => SANCTUM_KINDS.has(enemy.kind),
    vendor: false,   // Fenwick narrates, he does not sell
  });
}

// ===== The Verdant Hollow — Greta Thornby's chain (post-Noctyra, L106–118) =====
// A disgraced royal botanist, laughed out of the academy for insisting the Hollow
// Star's death would make things GROW. She is right, vindicated, and furious about
// it — gleeful and bitter in equal measure, taking notes while the flora tries to
// eat her. Four culls (one per trash family), the spore-queen Spireshade, a proof-
// run, the world-root Vorthal, then a coda for her paper. Her own zone-gated bounty.
// The coda hands over a named unique (Greta's Pressed Bloom) via rewardItem.
const HOLLOW_QUESTS = [
  { id: 'h_swarm', name: 'It Spreads', targetKind: 'swarmling', count: 8, trial: false,
    intro: `You came DOWN here? On purpose? Then you're either a hero or a colleague, and the academy assures me those are different. Greta Thornby — botanist, exile, and the only living woman who PREDICTED this. They laughed me out of the lecture hall for a paper titled "On the Fertility of Catastrophe." Well. Read the room, gentlemen. The Mycelial Swarmlings are eating my sample plots faster than I can label them. Cull eight so I can finish a sentence in my field journal.`,
    outro: `Eight! And my plots survive another hour. Do you know what this place IS, hero? It's the world apologizing for the last hundred years, all at once, with no sense of restraint. Keep that blade out. The apology gets bigger.`,
    rewardXp: 7200, rewardGold: 9000 },
  { id: 'h_stalkers', name: 'Green on Green', targetKind: 'hollowstalker', count: 8, trial: false,
    intro: `New variable. The Hollowstalkers — wolves the moss took back. You won't see them; the whole vale is the exact color they are. You'll HEAR them, once, the way you hear a door close in a house you thought was empty. Eight, please, before they reclassify ME as a sample plot. Note for the journal: predators adapt to bioluminescence within a generation. The academy can read it on my headstone.`,
    outro: `Eight green ghosts, grounded. The journal grows; my pension does not. Spite is a renewable resource, hero — I have plenty for both of us.`,
    rewardXp: 7800, rewardGold: 9600 },
  { id: 'h_callers', name: 'A Cloud of Witnesses', targetKind: 'sporecaller', count: 6, trial: false,
    intro: `Now the truly maddening ones. The Sporecallers stand at the back and SPIT — clouds of glowing spore that find you across the whole grotto. Close the distance or eat the cloud; there's no third option, I checked, twice, painfully. Six down. And if you cough magenta for a week, that's normal. Probably. I'd cite the source but the source is "I tried it."`,
    outro: `Six callers silenced and the air almost breathable. I'm cataloguing a new genus per hour down here, hero. The academy will have to invent a longer Latin just to apologize.`,
    rewardXp: 8400, rewardGold: 10500 },
  { id: 'h_wardens', name: 'They Were People', targetKind: 'bloomwarden', count: 5, trial: false,
    intro: `…The Bloomwardens I will not enjoy. Look closely — under the bark and the flowers, that's a person the Hollow grew THROUGH. The old vale-keepers, rooted where they stood, made into trellises. Steel skips off the bark, so don't fence — break them. Five. It's a mercy, hero, though it won't feel like one. Bring me a flower from each. For the record. For them.`,
    outro: `Five freed — if "freed" is the word. I pressed each flower in the journal. Someone should remember they were people before they were scenery. Thank you for breaking them gently. Or at all.`,
    rewardXp: 9000, rewardGold: 11500 },
  { id: 'h_spireshade', name: 'The Mother of It All', targetKind: 'spireshade', count: 1, trial: true,
    intro: `Everything down here feeds ONE thing, and it sits in the great glowing pool: SPIRESHADE, the Mother-Bloom — the spore-queen the whole vale answers to. She erupts blooms straight up beneath your feet: MOVE the instant the ground glows. And when she bleeds she calls the green ghosts, so cut the wolves first. I have studied her from a sensible distance and concluded the sensible distance is "another vale." Go anyway. I'll be at the rim, taking the most important notes of my career.`,
    outro: `Spireshade — DECEASED, and the pool gone quiet for the first time since I arrived. Hero, the pool is draining. There's a deeper hollow under it, and something down there is BIGGER than her, and older, and it just noticed the quiet. Take these runes. Stand a little further from me.`,
    rewardXp: 18000, rewardGold: 22000, rewardRunes: 14 },
  { id: 'h_proof', name: 'For the Appendix', targetKind: 'sporecaller', count: 10, trial: false,
    intro: `Before you go down there and die magnificently — I need PROOF, hero. The academy will say I salted my own samples; they always do. Ten more Sporecallers, dropped where I can map exactly where they fell. Distribution data. It's the difference between a vindication and a vendetta, and I would honestly settle for either.`,
    outro: `Ten, perfectly plotted. The pattern is undeniable — the Hollow grows in a SPIRAL, hero, outward from the deepest point, like something exhaling. And at the center of the spiral is the thing the pool was hiding. Of course it is. The center of everything always is.`,
    rewardXp: 9600, rewardGold: 12000 },
  { id: 'h_vorthal', name: 'The First Root', targetKind: 'vorthal', count: 1, trial: true,
    intro: `So. The center of the spiral. VORTHAL, THE FIRST ROOT — the seed the Hollow Star's death cracked open, and everything green and wrong up here is just its leaves. It is the size of the cavern, hero, and it does not so much fight as GARDEN. Write these on your arm: it heaves the whole floor — JUMP. It lashes roots at your feet — MOVE. And it sows rot that stays and EATS the ground — move, and never set foot back in it; the vale will shrink until you've nowhere left to stand. It calls the green hunt; cut them quick. This is the deepest root in Taborea, hero. Pull it.`,
    outro: `…It's quiet. Truly quiet — the spores have stopped rising. Vorthal, the First Root, UPROOTED. Hero, the academy can keep its lecture halls; I have the only field journal that will ever matter, and you are every dangerous page of it. The Hollow will grow back — it always does, that's the whole horrible point — but slower now. Gentler. Take these runes. You've earned a season of quiet, and Taborea has earned a spring.`,
    rewardXp: 38000, rewardGold: 52000, rewardRunes: 30 },
  { id: 'h_coda', name: 'On the Fertility of Catastrophe', targetKind: 'bloomwarden', count: 6, trial: false,
    intro: `One last favor, and it's selfish. My paper needs a CONCLUSION. Six more Bloomwardens, the last of the rooted folk, laid to rest — so the final chapter reads "and then they were at peace," and not "and then I ran out of pages." Help me end it properly, hero. Everything down here deserves a proper ending. Even the academy. Especially the academy.`,
    outro: `Done. The journal closes. "On the Fertility of Catastrophe," by Greta Thornby — vindicated, retired, and the only botanist alive who gardened in hell and lived. Go on, hero. The world's growing back. Go grow with it.`,
    rewardXp: 11000, rewardGold: 14000, rewardItem: 'greta_pressed' },
];

const HOLLOW_BOUNTY = {
  name: "Botanist's Standing Order", count: 12,
  intro: `The Hollow re-seeds itself nightly — I have the spore-counts to prove it, and no one to prove them TO. A standing order, then: any twelve of the vale's creatures, and I'll pay from the grant the academy doesn't know I still draw. For science, hero. For SPITE.`,
  outro: `Twelve culled, twelve catalogued. The vale exhales and fills back in. The order stands — appallingly.`,
};
function hwBountyXp(game) { return Math.max(11000, game.player.level * 100); }
function hwBountyGold(game) { return Math.max(11000, game.player.level * 100); }

export function createHollowQuests() {
  return makeChain({
    quests: HOLLOW_QUESTS, bounty: HOLLOW_BOUNTY, bountyXp: hwBountyXp, bountyGold: hwBountyGold,
    npcName: 'Greta Thornby',
    bountyCounts: (enemy) => HOLLOW_KINDS.has(enemy.kind),
    vendor: false,   // Greta gardens in hell, she does not sell
  });
}

// ===== The Last Hour — Tamsin Verge's chain (capstone descent, L116–120) =====
// A time-broken survivor who speaks half a sentence ahead of herself, stood at
// the Hollow's deepest signpost where the spiral becomes a clockwork tomb. One
// trash cull, the two clockwork mini-bosses, then Khronaxis — and with the last
// hour taken, the world (and the player's level cap) can run on. Her own
// zone-gated bounty.
const HOROLOGIUM_QUESTS = [
  { id: 't_cogs', name: 'What the Sand Remembers', targetKind: 'cogwraith', count: 8, trial: false,
    intro: `You hear it too? Good. I thought it was just me, again, still, already. Down there the clock that holds the last hour is winding DOWN — and when it stops, so does everything. The wraiths are minutes that came loose. Put them back. Gently.`,
    outro: `Eight minutes, returned. The sand falls a little slower now. You're either very brave or you can't hear how this ends. Both, maybe.`,
    rewardXp: 8750, rewardGold: 6000 },
  { id: 't_quaranth', name: 'The Pendulum Stops for No One', targetKind: 'quaranth', count: 1, trial: true,
    intro: `Quaranth was the keeper before the keeper. It stopped mid-swing, mid-thought, mid-IS. It won't let you past until it finishes the sentence. Don't let it finish the sentence.`,
    outro: `It said its last word. 'Was.' Then it was. Tragic. Loot it.`,
    rewardXp: 12000, rewardGold: 14000, rewardRunes: 3 },
  { id: 't_echo', name: 'An Echo, A Minute Late', targetKind: 'echo', count: 1, trial: true,
    intro: `You'll meet yourself down there — a half-second behind, holding a grudge. It chains you to where you just stood and drops the sky where you'll be. Be somewhere it doesn't expect. Be NOW.`,
    outro: `It stopped echoing. The silence is the loudest thing I've heard in a hundred years.`,
    rewardXp: 12500, rewardGold: 18000, rewardRunes: 4 },
  { id: 't_khronaxis', name: 'The Hour That Was Kept', targetKind: 'khronaxis', count: 1, trial: true,
    intro: `Khronaxis kept the last hour so the world would never reach the end of it. It is so tired. It WANTS you to take the hour — but its hands don't know how to let go, and they're as old as the world and they hit like it. When its time runs out it will rage; finish it before it remembers how. Then the hour is yours. Mind it. The world's counting on you — literally.`,
    outro: `It let go. The sand runs both ways now. You can age past where the world ever let anyone age. Go on. You've earned the next twenty years.`,
    rewardXp: 11460, rewardGold: 50000, rewardRunes: 8 },
];

const HOROLOGIUM_BOUNTY = {
  name: 'Loose Minutes', count: 12,
  intro: `The clock sheds minutes faster than I can gather them — twelve more of the loose ones, whatever shape they've taken. Cogwraiths, Sandflayers, doesn't matter. Bring the time back. Some of it. Any of it.`,
  outro: `Twelve minutes, gathered. The sand stalls a heartbeat longer. We are, against all odds, not yet out of time.`,
};
function hgBountyXp(game) { return Math.max(11000, game.player.level * 100); }
function hgBountyGold(game) { return Math.max(11000, game.player.level * 100); }

export function createHorologiumQuests() {
  return makeChain({
    quests: HOROLOGIUM_QUESTS, bounty: HOROLOGIUM_BOUNTY, bountyXp: hgBountyXp, bountyGold: hgBountyGold,
    npcName: 'Tamsin Verge',
    bountyCounts: (enemy) => HOROLOGIUM_KINDS.has(enemy.kind),
    vendor: false,   // Tamsin keeps time, she does not sell
  });
}

function makeChain(cfg) {
  const bountyXp = cfg.bountyXp, bountyGold = cfg.bountyGold;
  const npcName = cfg.npcName || 'Pioneer Barnaby';
  const state = {
    quests: cfg.quests.map((q) => ({ ...q, progress: 0, status: 'locked' })),
    bounty: { ...cfg.bounty, progress: 0, status: 'locked' }, // locked|ready|active|complete

    current() {
      return this.quests.find((q) => q.status !== 'done');
    },

    // has the chain progressed far enough that quest `id` is offerable?
    reached(id) {
      for (const q of this.quests) {
        if (q.id === id) return true;
        if (q.status !== 'done') return false;
      }
      return false;
    },

    // the bounty unlocks once the original story (pre-Trials) is done
    syncBounty() {
      const storyDone = this.quests.filter((q) => !q.trial).every((q) => q.status === 'done');
      if (storyDone && this.bounty.status === 'locked') this.bounty.status = 'ready';
    },

    // what hangs over the NPC's head
    marker() {
      this.syncBounty();
      if (this.bounty.status === 'complete') return '?';
      const q = this.current();
      if (q) {
        if (q.status === 'complete') return '?';
        if (q.status === 'locked') return '!';
        return '';
      }
      if (this.bounty.status === 'ready') return '!';
      return '';
    },

    onKill(game, enemy) {
      const q = this.current();
      if (q && q.status === 'active' && enemy.kind === q.targetKind) {
        q.progress++;
        if (q.progress >= q.count) {
          q.status = 'complete';
          game.audio.quest();
          game.ui.log(`Quest objective complete: ${q.name}!`, 'log-quest');
          game.ui.floatText(game.player.group.position, 'Objective complete!', 'xp');
        } else {
          game.ui.log(`${q.name}: ${q.progress}/${q.count}`, 'log-quest');
        }
        game.ui.refreshQuestTracker(this);
        game.save?.();
        return;
      }
      // the standing bounty counts kills of its own zone's creatures
      if (this.bounty.status === 'active' && cfg.bountyCounts(enemy)) {
        this.bounty.progress++;
        if (this.bounty.progress >= this.bounty.count) {
          this.bounty.status = 'complete';
          game.audio.quest();
          game.ui.log(`Bounty filled! Return to collect it.`, 'log-quest');
        }
        game.ui.refreshQuestTracker(this);
      }
    },

    openDialog(game) {
      this.syncBounty();
      if (this.bounty.status === 'complete') { this.openBountyDialog(game); return; }
      const q = this.current();
      if (q) { this.openMainDialog(game, q); return; }
      this.openBountyDialog(game);
    },

    // buttons every dialog carries: the vendor's wares (Barnaby only), and the
    // bounty board once it's open
    extraButtons(game) {
      const extras = [];
      if (cfg.vendor) {
        extras.push({
          label: 'Wares',
          action: () => { game.ui.hideDialog(); game.ui.showShop(game); },
        }, {
          label: 'Sell Loot',
          action: () => { game.ui.hideDialog(); game.ui.showInventory(game, 'sell'); },
        });
      }
      if (this.current() && (this.bounty.status === 'ready' || this.bounty.status === 'active')) {
        extras.push({
          label: 'Bounty Board',
          action: () => this.openBountyDialog(game),
        });
      }
      return extras;
    },

    openMainDialog(game, q) {
      const ui = game.ui;
      const extras = this.extraButtons(game);
      if (q.status === 'locked') {
        ui.showDialog({
          title: npcName,
          text: q.intro,
          objectives: [`${q.name}: slay ${q.count} × ${targetName(q.targetKind)}`],
          rewards: rewardLine(q),
          buttons: [
            { label: 'Accept', primary: true, action: () => {
                q.status = 'active';
                game.audio.quest();
                ui.log(`Quest accepted: ${q.name}`, 'log-quest');
                ui.refreshQuestTracker(this);
                ui.hideDialog();
                game.save?.();
              } },
            { label: 'Not yet', action: () => ui.hideDialog() },
            ...extras,
          ],
        });
      } else if (q.status === 'active') {
        ui.showDialog({
          title: npcName,
          text: `Still out there, are they? You've felled ${q.progress} of ${q.count}. The plains believe in you, even if your quarry doesn't.`,
          buttons: [{ label: 'Farewell', action: () => ui.hideDialog() }, ...extras],
        });
      } else if (q.status === 'complete') {
        ui.showDialog({
          title: npcName,
          text: q.outro,
          rewards: rewardLine(q),
          buttons: [
            { label: 'Complete Quest', primary: true, action: () => {
                q.status = 'done';
                game.player.gainXp(game, q.rewardXp);
                game.player.gainGold(game, q.rewardGold);
                if (q.rewardRunes) {
                  game.player.runes += q.rewardRunes;
                  ui.log(`Received ${q.rewardRunes} glowing runes!`, 'log-loot');
                }
                // some quests hand over a named unique (e.g. Greta's coda)
                if (q.rewardItem) {
                  const it = makeUnique(q.rewardItem);
                  if (it) {
                    game.player.addItem(game, it);
                    ui.log(`Received ${it.name}!`, 'log-loot');
                  }
                }
                game.audio.quest();
                ui.log(`Quest complete: ${q.name}!`, 'log-quest');
                ui.refreshQuestTracker(this);
                ui.hideDialog();
                game.save?.();
              } },
            ...extras,
          ],
        });
      }
    },

    openBountyDialog(game) {
      const ui = game.ui;
      const b = this.bounty;
      const wares = cfg.vendor ? [{
        label: 'Wares',
        action: () => { ui.hideDialog(); ui.showShop(game); },
      }] : [];
      const payLine = `Rewards: ${bountyXp(game)} XP, ${bountyGold(game)} gold, maybe a rune`;
      if (b.status === 'ready') {
        ui.showDialog({
          title: npcName,
          text: b.intro,
          objectives: [`${b.name}: slay any ${b.count} creatures or bandits`],
          rewards: payLine,
          buttons: [
            { label: 'Take the Bounty', primary: true, action: () => {
                b.status = 'active';
                b.progress = 0;
                game.audio.quest();
                ui.log(`Bounty accepted: any ${b.count} kills.`, 'log-quest');
                ui.refreshQuestTracker(this);
                ui.hideDialog();
              } },
            { label: 'Not yet', action: () => ui.hideDialog() },
            ...wares,
          ],
        });
      } else if (b.status === 'active') {
        ui.showDialog({
          title: npcName,
          text: `The bounty board shows ${b.progress} of ${b.count}. Anything that growls or robs counts, friend.`,
          buttons: [{ label: 'Farewell', action: () => ui.hideDialog() }, ...wares],
        });
      } else if (b.status === 'complete') {
        ui.showDialog({
          title: npcName,
          text: b.outro,
          rewards: payLine,
          buttons: [
            { label: 'Collect Bounty', primary: true, action: () => {
                b.status = 'ready';
                b.progress = 0;
                game.player.gainXp(game, bountyXp(game));
                game.player.gainGold(game, bountyGold(game));
                if (Math.random() < 0.5) {
                  game.player.runes += 1;
                  ui.log('A glowing rune rides along with the coin!', 'log-loot');
                }
                game.audio.quest();
                ui.refreshQuestTracker(this);
                ui.hideDialog();
              } },
            ...wares,
          ],
        });
      }
    },

    serialize() {
      return {
        quests: Object.fromEntries(
          this.quests.map((q) => [q.id, { status: q.status, progress: q.progress }])
        ),
        bounty: { status: this.bounty.status, progress: this.bounty.progress },
      };
    },

    load(saved) {
      if (!saved) return;
      // legacy saves stored a flat {id: {...}} map with no bounty; new saves
      // wrap it as {quests, bounty}. Accept both so old saves stay loadable.
      const quests = saved.quests || saved;
      for (const q of this.quests) {
        const s = quests[q.id];
        if (s) { q.status = s.status; q.progress = s.progress; }
      }
      // restore an in-flight/uncollected bounty (active progress, complete-but-
      // uncollected reward) before syncBounty, which can only promote locked→ready
      if (saved.bounty && saved.bounty.status) {
        this.bounty.status = saved.bounty.status;
        this.bounty.progress = saved.bounty.progress || 0;
      }
      this.syncBounty();
    },
  };
  return state;
}

function targetName(kind) {
  return {
    boar: 'Young Boar', wolf: 'Forest Wolf', boss: 'Bodo the Ravager',
    bandit: 'Grimblade Bandit', banditking: 'Rurik the Red',
    korgrim: 'Korgrim the Mountain', vexnar: 'Vexnar the Ash Dragon', morgrath: 'Morgrath, the Pale King',
    ossus: 'Gravelord Ossus', vargoth: 'Vargoth the Undying',
    cinderwraith: 'Cinder Wraith', ashhound: 'Ash Hound', obsidiangolem: 'Obsidian Golem',
    emberlord: 'Emberlord Vssaric', pyraxis: 'Pyraxis, the Cinder Wyrm',
    hoarfrostserpent: 'Hoarfrost Serpent', frostfangstalker: 'Frostfang Stalker',
    rimeboundsentinel: 'Rimebound Sentinel', hrimnir: 'Hrimnir, the Avalanche-Jarl',
    custodian: 'Astral Custodian', seraphel: 'Seraphel, the Vault Warden',
    noctyra: 'Noctyra, the Hollow Star', thunderbristle: 'Thunderbristle, Sire of All Boars',
    sporecaller: 'Sporecaller', hollowstalker: 'Hollowstalker', bloomwarden: 'Bloomwarden',
    swarmling: 'Mycelial Swarmling', spireshade: 'Spireshade, the Mother-Bloom',
    vorthal: 'Vorthal, the First Root',
    cogwraith: 'Cogwraith', sandflayer: 'Sandflayer',
    quaranth: 'Quaranth, the Unwound', echo: 'Echo of the First Minute',
    khronaxis: 'Khronaxis, the Hour That Was Kept',
  }[kind] || kind;
}

function rewardLine(q) {
  let s = `Rewards: ${q.rewardXp} XP, ${q.rewardGold} gold`;
  if (q.rewardRunes) s += `, ${q.rewardRunes} glowing runes`;
  return s;
}
