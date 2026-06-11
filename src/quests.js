// Quest chain in the classic style: boars, wolves, a boss — then bandits, their
// king, and finally an endless bounty board for the long evenings.

const QUESTS = [
  {
    id: 'boars',
    name: 'Boar Trouble',
    targetKind: 'boar', count: 6,
    intro: `Ah, a fresh face! Welcome to the Howling Plains, adventurer. The young boars have grown bold — they've torn up our seed stores twice this week. Thin their numbers, would you? Six should send the message.`,
    outro: `Ha! I can hear the plains breathing easier already. Here — you've earned this.`,
    rewardXp: 150, rewardGold: 50,
  },
  {
    id: 'wolves',
    name: 'Fangs of the Forest',
    targetKind: 'wolf', count: 4,
    intro: `With the boars scattered, something worse creeps in: forest wolves, down from the tree line. They stalk anyone who strays from the path. Put down four of the beasts — and watch your back out there.`,
    outro: `Four wolves! And barely a scratch on you. The pioneers will sleep sound tonight.`,
    rewardXp: 280, rewardGold: 90,
  },
  {
    id: 'boss',
    name: 'The Ravager',
    targetKind: 'boss', count: 1,
    intro: `There's a reason the boars fled toward our camp. An old terror has woken in the eastern hollow — the trappers call him BODO THE RAVAGER. Tusks like scythes. Follow the east path to its end… and end HIM. Goddess watch over you.`,
    outro: `By the Goddess… you actually did it. Bodo the Ravager, felled! Your name will be sung in Varanas, friend. Take this — runes of the old world. You've more than earned them.`,
    rewardXp: 500, rewardGold: 250, rewardRunes: 3,
  },
  {
    id: 'bandits',
    name: 'Red Cloaks on the Ridge',
    targetKind: 'bandit', count: 6,
    intro: `Word of Bodo's fall has spread — and drawn vultures of the two-legged kind. Grimblade bandits have raised tents on the northwest ridge, and our supply runners come back robbed or not at all. Follow the west path. Six of those red cloaks in the dirt should loosen their nerve.`,
    outro: `Six Grimblades down! The runners came through untouched this morning — first time in weeks. You're worth ten of us, friend.`,
    rewardXp: 700, rewardGold: 220,
  },
  {
    id: 'banditking',
    name: 'The Bandit King',
    targetKind: 'banditking', count: 1,
    intro: `The bandits don't scatter because they fear something worse than us: RURIK THE RED, the self-crowned king of the ridge. They say his blade has never been lifted in a fair fight — so don't give him one. Cut the head off the Grimblades, and the plains are truly free.`,
    outro: `Rurik the Red, dead by your hand… The Grimblades are already melting into the hills. Whatever roads you walk next, adventurer, the Howling Plains will remember your name. Take these runes — a king's ransom.`,
    rewardXp: 1100, rewardGold: 450, rewardRunes: 3,
  },
  {
    id: 'korgrim',
    name: 'Trial I: The Mountain That Walks',
    targetKind: 'korgrim', count: 1, trial: true,
    intro: `You've outgrown the plains, hero — so hear an old story. Three terrors were bound at the valley's edges by the sentinel stones, and the stones are failing. The first: KORGRIM THE MOUNTAIN, a giant on the northern rim. Steel barely dents him, and when he raises his fists, the very earth shatters — JUMP the moment he does, or be broken. Stock up on draughts first. I mean it.`,
    outro: `The ground stopped trembling an hour ago — that was YOU? Korgrim the Mountain, toppled! The stones can rest… two more cannot.`,
    rewardXp: 6000, rewardGold: 1200, rewardRunes: 4,
  },
  {
    id: 'vexnar',
    name: 'Trial II: Ash on the Wind',
    targetKind: 'vexnar', count: 1, trial: true,
    intro: `The second terror nests on the eastern rim: VEXNAR THE ASH DRAGON. The trappers who've seen her and lived all say the same thing — when she draws breath, the ground beneath you glows. Do not be standing there when she finishes. RUN from the mark, every single time.`,
    outro: `Ash on the wind, and the dragon's shadow gone from the rim… You are no adventurer anymore, friend. You are a legend with muddy boots.`,
    rewardXp: 10000, rewardGold: 2000, rewardRunes: 6,
  },
  {
    id: 'morgrath',
    name: 'Trial III: The Pale King',
    targetKind: 'morgrath', count: 1, trial: true,
    intro: `The last and worst waits in the southwest: MORGRATH, THE PALE KING. Dead a thousand years and angry about all of them. He tears the earth open beneath your feet — move! — and worse: every wound you deal him, he answers by raising the dead to his side. Cut the thralls down fast, or drown in them. Goddess keep you. The plains will be watching.`,
    outro: `The Pale King… unkinged. I have no words, and Barnaby ALWAYS has words. The Trials are done, the stones stand quiet, and Taborea owes you a debt it cannot count. The bounty board is yours forever, hero.`,
    rewardXp: 16000, rewardGold: 3500, rewardRunes: 10,
  },
];

const BOUNTY = {
  name: "Pioneer's Bounty",
  count: 10,
  intro: `The plains are safe — but never tame. The pioneers post a standing bounty: any ten beasts or brigands culled, and the coin is yours. Come back whenever the pouch feels light, hero. There's always work.`,
  outro: `Ten more pests off the plains. The bounty stands, as always — coin for claws.`,
};

// the bounty pays by reputation — it scales with your level
function bountyXp(game) { return Math.max(300, game.player.level * 40); }
function bountyGold(game) { return Math.max(150, game.player.level * 20); }

export function createQuests() {
  const state = {
    quests: QUESTS.map((q) => ({ ...q, progress: 0, status: 'locked' })),
    bounty: { ...BOUNTY, progress: 0, status: 'locked' }, // locked|ready|active|complete

    current() {
      return this.quests.find((q) => q.status !== 'done');
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
      // the standing bounty counts anything with a pulse
      if (this.bounty.status === 'active') {
        this.bounty.progress++;
        if (this.bounty.progress >= this.bounty.count) {
          this.bounty.status = 'complete';
          game.audio.quest();
          game.ui.log(`Bounty filled! Return to Barnaby.`, 'log-quest');
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

    // buttons every Barnaby dialog carries: his wares, and the bounty board if open
    extraButtons(game) {
      const extras = [{
        label: 'Wares',
        action: () => { game.ui.hideDialog(); game.ui.showShop(game); },
      }];
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
      const wares = [{
        label: 'Wares',
        action: () => { ui.hideDialog(); ui.showShop(game); },
      }];
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
      return Object.fromEntries(
        this.quests.map((q) => [q.id, { status: q.status, progress: q.progress }])
      );
    },

    load(saved) {
      if (!saved) return;
      for (const q of this.quests) {
        const s = saved[q.id];
        if (s) { q.status = s.status; q.progress = s.progress; }
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
  }[kind] || kind;
}

function rewardLine(q) {
  let s = `Rewards: ${q.rewardXp} XP, ${q.rewardGold} gold`;
  if (q.rewardRunes) s += `, ${q.rewardRunes} glowing runes`;
  return s;
}
