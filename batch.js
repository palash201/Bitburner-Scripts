/** @param {NS} ns */
export async function main(ns) {
  let target = ns.args[0];
  let host = ns.args[1];
  let OFFSET = 30; // additional time to wait after
  let SPACING = 250;
  let PERCENT_TO_HACK = 0.01
  let maxMoney = ns.getServerMaxMoney(target);
  let minSecurity = ns.getServerMinSecurityLevel(target);

  ns.scp(['delayedWeaken.js', 'delayedGrow.js', 'delayedHack.js', 'batchprep.js'], host, 'home');

  let ramServers = [host];

  function hasAccessOrTryRoot(hostname) {
    if (!ns.hasRootAccess(hostname)) {
      ns.brutessh(hostname);
      ns.ftpcrack(hostname);
      ns.relaysmtp(hostname);
      ns.sqlinject(hostname);
      ns.httpworm(hostname);
      if (ns.getServerNumPortsRequired(hostname) <= 5) {
        ns.nuke(hostname);
      }
    }
    return ns.hasRootAccess(hostname);
  }

  let currentSecurity = ns.getServerSecurityLevel(target);
  let currentMoney = ns.getServerMoneyAvailable(target);

  if (currentSecurity - minSecurity > 1 || currentMoney < maxMoney) {
    ns.exec('batchprep', host, 1, target)
    while (true) {
      await ns.sleep(10);
      if (ns.readPort(parseInt(host.charAt(host.length - 1))) != "NULL PORT DATA") {
        break;
      }
    }
  }

  // now we have min sec and max money

  while (true) {
    let weakenTime = ns.getWeakenTime(target);
    let hackTime = weakenTime / 4;
    let growTime = hackTime * 3.2;

    let hackThreadsNeeded = Math.floor(ns.hackAnalyzeThreads(target, maxMoney * PERCENT_TO_HACK));
    let growThreadsNeeded = Math.ceil(ns.growthAnalyze(target, 1 / (1 - PERCENT_TO_HACK)));
    let securityIncrease1 = 0.002 * hackThreadsNeeded;
    let securityIncrease2 = ns.growthAnalyzeSecurity(growThreadsNeeded, target);
    let weakenThreadsNeeded1 = Math.ceil(securityIncrease1 / 0.05);
    let weakenThreadsNeeded2 = Math.ceil(securityIncrease2 / 0.05);

    let totalThreadsNeeded = hackThreadsNeeded + growThreadsNeeded + weakenThreadsNeeded1 + weakenThreadsNeeded2;

    let maxThreadsUsable = 0;

    for (const currentHost of ramServers) {
      if (hasAccessOrTryRoot(currentHost)) {
        let maxRam = ns.getServerMaxRam(currentHost);
        let hostThreadsUsable = Math.floor(((maxRam - ns.getServerUsedRam(currentHost)) / ns.getScriptRam('weaken.js')));
        maxThreadsUsable += hostThreadsUsable;
      }
    }

    if (totalThreadsNeeded > maxThreadsUsable) {
      let divisor = totalThreadsNeeded / maxThreadsUsable;
      hackThreadsNeeded = Math.floor(hackThreadsNeeded / divisor);
      growThreadsNeeded = Math.ceil(growThreadsNeeded / divisor);
      weakenThreadsNeeded1 = Math.ceil(weakenThreadsNeeded1 / divisor);
      weakenThreadsNeeded2 = Math.ceil(weakenThreadsNeeded2 / divisor);
      let totalThreadsNeeded = hackThreadsNeeded + growThreadsNeeded + weakenThreadsNeeded1 + weakenThreadsNeeded2;
    }

    let batches = Math.floor(maxThreadsUsable / totalThreadsNeeded);

    let threadsUsed = 0;

    for (let i = 0; i < batches; i++) {
      let weakenThreadsUsed1 = 0;
      let weakenFinish1 = Date.now() + weakenTime;
      for (const currentHost of ramServers) {
        let maxRam = ns.getServerMaxRam(currentHost);
        let hostThreadsUsable = Math.floor(((maxRam - ns.getServerUsedRam(currentHost)) / ns.getScriptRam('weaken.js')));
        let threads = Math.min(weakenThreadsNeeded1 - weakenThreadsUsed1, hostThreadsUsable);
        if (threads == 0) {
          continue;
        }
        ns.exec('delayedWeaken.js', currentHost, threads, target, weakenFinish1, weakenTime);
        weakenThreadsUsed1 += threads;
      }
      let weakenThreadsUsed2 = 0;
      let weakenFinish2 = weakenFinish1 + SPACING * 2;
      for (const currentHost of ramServers) {
        let maxRam = ns.getServerMaxRam(currentHost);
        let hostThreadsUsable = Math.floor(((maxRam - ns.getServerUsedRam(currentHost)) / ns.getScriptRam('weaken.js')));
        let threads = Math.min(weakenThreadsNeeded2 - weakenThreadsUsed2, hostThreadsUsable);
        if (threads == 0) {
          continue;
        }
        ns.exec('delayedWeaken.js', currentHost, threads, target, weakenFinish2, weakenTime);
        weakenThreadsUsed2 += threads;
      }
      let growFinish = weakenFinish2 - SPACING;
      let growThreadsUsed = 0;
      for (const currentHost of ramServers) {
        let maxRam = ns.getServerMaxRam(currentHost);
        let hostThreadsUsable = Math.floor(((maxRam - ns.getServerUsedRam(currentHost)) / ns.getScriptRam('weaken.js')));
        let threads = Math.min(growThreadsNeeded - growThreadsUsed, hostThreadsUsable);
        if (threads == 0) {
          continue;
        }
        ns.exec('delayedGrow.js', currentHost, threads, target, growFinish, growTime);
        growThreadsUsed += threads;
      }
      let hackFinish = weakenFinish1 - SPACING;
      let hackThreadsUsed = 0;
      for (const currentHost of ramServers) {
        let maxRam = ns.getServerMaxRam(currentHost);
        let hostThreadsUsable = Math.floor(((maxRam - ns.getServerUsedRam(currentHost)) / ns.getScriptRam('weaken.js')));
        let threads = Math.min(hackThreadsNeeded - hackThreadsUsed, hostThreadsUsable);
        if (threads == 0) {
          continue;
        }
        ns.exec('delayedHack.js', currentHost, threads, target, hackFinish, hackTime);
        hackThreadsUsed += threads;
      }

      threadsUsed += totalThreadsNeeded;

      let waitTime = Math.max(SPACING * 3 + OFFSET, weakenTime / batches + OFFSET)
      await ns.sleep(waitTime);
    }
    await ns.sleep(weakenTime + OFFSET);
  }
}
