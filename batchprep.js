/** @param {NS} ns */
export async function main(ns) {
  let target = ns.args[0];
  let host = ns.args[1];
  let OFFSET = 250; // additional time to wait after
  let maxMoney = ns.getServerMaxMoney(target);
  let minSecurity = ns.getServerMinSecurityLevel(target);

  ns.scp(['weaken.js', 'grow.js', 'hack.js'], host, 'home');

  let ramServers = [host];

  while (true) {
    let currentSecurity = ns.getServerSecurityLevel(target);
    let currentMoney = ns.getServerMoneyAvailable(target);
    if (currentSecurity - minSecurity >= 1) {
      let waitTime = ns.getWeakenTime(target);
      let threadsNeeded = Math.ceil((currentSecurity - minSecurity) / 0.05);
      let threadsUsed = 0;
      for (const currentHost of ramServers) {
        if (!ns.hasRootAccess(currentHost)) {
          ns.brutessh(currentHost);
          ns.ftpcrack(currentHost);
          ns.relaysmtp(currentHost);
          ns.sqlinject(currentHost);
          ns.httpworm(currentHost);
          if (ns.getServerNumPortsRequired(currentHost) <= 5) {
            ns.nuke(currentHost);
          }
        }
        else {
          let maxRam = ns.getServerMaxRam(currentHost);
          let maxThreadsUsable = Math.floor(((maxRam - ns.getServerUsedRam(currentHost)) / ns.getScriptRam('weaken.js')));
          let threads = Math.min(Math.max(threadsNeeded - threadsUsed, 0), maxThreadsUsable);
          if (threads == 0) {
            continue;
          }
          ns.tprint("Remaining needed " + (threadsNeeded - threadsUsed) + ", max usable " + maxThreadsUsable + ", using " + threads + " for weaken on " + target);
          ns.exec('weaken.js', currentHost, threads, target);
          threadsUsed += threads;
        }

      }
      await ns.sleep(waitTime + OFFSET);
    }
    else if (currentMoney < maxMoney) {
      let waitTime = ns.getGrowTime(target);
      let threadsNeeded = Math.ceil(ns.growthAnalyze(target, maxMoney / currentMoney));
      let threadsUsed = 0;
      for (const currentHost of ramServers) {
        if (!ns.hasRootAccess(currentHost)) {
          ns.brutessh(currentHost);
          ns.ftpcrack(currentHost);
          ns.relaysmtp(currentHost);
          ns.sqlinject(currentHost);
          ns.httpworm(currentHost);
          if (ns.getServerNumPortsRequired(currentHost) <= 5) {
            ns.nuke(currentHost);
          }
        }
        else {
          let maxRam = ns.getServerMaxRam(currentHost);
          let maxThreadsUsable = Math.floor(((maxRam - ns.getServerUsedRam(currentHost)) / ns.getScriptRam('grow.js')));
          let threads = Math.min(Math.max(threadsNeeded - threadsUsed, 0), maxThreadsUsable);
          if (threads == 0) {
            ns.tprint("broke on " + currentHost);
            continue;
          }
          ns.tprint("Remaining needed " + (threadsNeeded - threadsUsed) + ", max usable " + maxThreadsUsable + ", using " + threads + " for grow on " + target);
          ns.exec('grow.js', currentHost, threads, target);
          threadsUsed += threads;
        }
      }
      await ns.sleep(waitTime + OFFSET);
    }
    else {
      ns.writePort(parseInt(host.charAt(host.length - 1)), "anything");
      ns.exit();
    }
  }
}
