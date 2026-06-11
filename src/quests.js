// Quest chain in the classic style: boars, wolves, a boss — then bandits, their
// king, and finally an endless bounty board for the long evenings.

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

export function createQuests() {
  return makeChain({
    quests: QUESTS, bounty: BOUNTY, bountyXp, bountyGold,
    // Barnaby's bounty counts anything EXCEPT Highlands creatures
    bountyCounts: (enemy) => !HIGHLAND_KINDS.has(enemy.kind),
    vendor: true,    // Barnaby sells wares + buys loot
  });
}

export function createHighlandQuests() {
  return makeChain({
    quests: HIGHLAND_QUESTS, bounty: HIGHLAND_BOUNTY, bountyXp: hBountyXp, bountyGold: hBountyGold,
    bountyCounts: (enemy) => HIGHLAND_KINDS.has(enemy.kind),
    vendor: false,   // Kaska is no vendor
  });
}

function makeChain(cfg) {
  const bountyXp = cfg.bountyXp, bountyGold = cfg.bountyGold;
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
          text: `Still out there, are they? You've felled ${q.progress} of ${q.count}. The plains believe in you, even if your quarry doesn't.`,
          buttons: [{ label: 'Farewell', action: () => ui.hideDialog() }, ...extras],
        });
      } else if (q.status === 'complete') {
        ui.showDialog({
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
          text: `The bounty board shows ${b.progress} of ${b.count}. Anything that growls or robs counts, friend.`,
          buttons: [{ label: 'Farewell', action: () => ui.hideDialog() }, ...wares],
        });
      } else if (b.status === 'complete') {
        ui.showDialog({
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
  }[kind] || kind;
}

function rewardLine(q) {
  let s = `Rewards: ${q.rewardXp} XP, ${q.rewardGold} gold`;
  if (q.rewardRunes) s += `, ${q.rewardRunes} glowing runes`;
  return s;
}
