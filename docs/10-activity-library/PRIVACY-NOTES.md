# Privacy and Security Notes

*Source: T7, verified against Apple's own security documentation and published incident records, 2026-08-02.*

> This applies to the whole intimacy category and to anything else you send each other that you would
> not want read by a third party. It is here as its own document rather than buried in an activity
> because it applies across all of them.

---

## The short version

**Your live FaceTime calls are genuinely end-to-end encrypted. Your iMessages are too — right up until
iCloud Backup saves a copy Apple can read.** That backup is on by default. Turning on Advanced Data
Protection closes it. Both of you have to do it separately.

---

## The findings

### iMessage content encryption

**Finding.** Apple states iMessage content and attachments are secured with end-to-end encryption in transit and storage, and that 'Apple can't decrypt the data.'

**What it means for you.** Text/photo content sent via iMessage cannot be read by Apple itself in transit — but see the iCloud Backup finding below, which is the actual hole most people miss.

*Confidence: HIGH · [source](https://support.apple.com/guide/security/imessage-security-overview-secd9764312f/web) · 2026-08-02*

### FaceTime call encryption

**Finding.** FaceTime audio/video, including Group FaceTime, is end-to-end encrypted (AES-256 in Counter Mode, HMAC-SHA-1 authenticated); Apple states it 'can't decrypt the data.'

**What it means for you.** The couple's primary channel is genuinely end-to-end encrypted for the live call itself. This does not cover screen recordings or screenshots taken by either party's own device, which are entirely outside encryption's scope.

*Confidence: HIGH · [source](https://support.apple.com/guide/security/facetime-security-seca331c55cd/web) · 2026-08-02*

### Standard iCloud Backup is NOT end-to-end encrypted — the commonly-missed hole

**Finding.** With iCloud Backup turned on (the default), Apple states the backup includes a copy of the Messages-in-iCloud encryption key 'so Apple can help the user recover their messages' — meaning Apple itself holds a key that can decrypt backed-up message content. The backup service's own key is 'securely backed up to iCloud Hardware Security Modules in Apple data centers,' i.e. Apple-controlled, not exclusively the user's.

**What it means for you.** Anything sent over iMessage is only genuinely end-to-end encrypted for as long as iCloud Backup stays off, or until Advanced Data Protection is turned on. With default settings, a backed-up copy of intimate photos, voice memos, or texts is accessible to Apple, and therefore reachable via a valid legal request to Apple or exposed if Apple's own systems are compromised.

*Confidence: HIGH · [source](https://support.apple.com/guide/security/icloud-backup-security-sec2c21e7f49/web) · 2026-08-02*

### Advanced Data Protection closes the backup/photos hole, but not completely, and is opt-in

**Finding.** Turning on Advanced Data Protection raises the number of iCloud data categories under end-to-end encryption from 14 to 23, explicitly including iCloud Backup and Photos. Even with it on, iCloud Calendar, Contacts, Mail, and collaborative Pages/Numbers/Keynote documents remain outside end-to-end encryption.

**What it means for you.** If this couple wants their intimate photos and messages to actually be unreadable by Apple, both partners need to individually turn on Advanced Data Protection in Settings — it is opt-in, not default, and it's a per-Apple-ID setting, so one partner enabling it does not protect the other's backup.

*Confidence: HIGH · [source](https://support.apple.com/guide/security/advanced-data-protection-for-icloud-sec973254c5f/web) · 2026-08-02*

### Hidden Photos album is locked by default, but full protection detail unconfirmed

**Finding.** Apple's own support page, titled 'Hide photos on your iPhone, iPad, Mac, or Apple Vision Pro with the Hidden album,' confirms the feature exists; corroborating non-Apple sources describe both the Hidden and Recently Deleted albums as 'locked by default' behind Face ID/Touch ID/passcode. The full body text of Apple's own page could not be retrieved after repeated attempts, so the exact authentication mechanism is confirmed only at medium confidence.

**What it means for you.** Hidden is not the same as invisible-to-Apple, and hidden does not mean unlocked-by-default access — treat the Hidden album as a local screen-lock, not an encryption boundary. It does not change any of the iCloud Backup exposure above.

*Confidence: MEDIUM · [source](https://support.apple.com/en-us/104987) · 2026-08-02*

### We-Connect (We-Vibe) has a documented history of undisclosed data collection

**Finding.** In 2016, independent researchers found the We-Connect app (which controls We-Vibe devices, including for long-distance/remote-control use) collecting usage data without adequate disclosure. Standard Innovation, the manufacturer, settled the resulting class action for approximately $3.2 million in March 2017.

**What it means for you.** This is a concrete, sourced precedent, not a hypothetical risk: connected intimacy devices are a documented target for exactly this kind of data exposure. It doesn't mean every device in this category behaves this way today, but it is the reason to actually read a device's privacy policy before connecting an account.

*Confidence: MEDIUM · [source](https://en.wikipedia.org/wiki/We-Vibe) · 2026-08-02*

### We-Connect links to a state-specific health-data privacy policy

**Finding.** We-Vibe's own site links to both a general Privacy Policy and a separate 'Washington Consumer Health Data Privacy Policy' specifically for the We-Connect app.

**What it means for you.** The existence of a state-specific consumer-health-data policy signals regulators now treat this category of app data as health data subject to extra protection in at least some US jurisdictions — worth reading the linked policy before connecting an account rather than assuming it's an ordinary app privacy policy.

*Confidence: MEDIUM · [source](https://www.we-vibe.com/we-connect) · 2026-08-02*

---

## The one action worth taking today

**Both of you turn on Advanced Data Protection** (Settings → your name → iCloud → Advanced Data
Protection). It raises iCloud categories under end-to-end encryption from 14 to 23, including Backup
and Photos. It is opt-in, it is per-Apple-ID, and one of you enabling it does nothing for the other's
backup. Note that Calendar, Contacts, Mail and collaborative Pages/Numbers/Keynote documents stay
outside end-to-end encryption even with it on.

## Two things this research could NOT confirm

- **Whether iMessage notifies the sender on screenshot.** Every candidate source 404'd. Not asserted
  here. Check it in Settings yourself before relying on it either way.
- **The app-permission and Bluetooth/cloud-relay model of connected devices.** T7 could not reliably
  locate the correct official App Store listings for the We-Connect, Lovense Remote or Kiiroo
  FeelConnect apps without working search. This is an open item in `ROUND-2-COMMISSIONS.md`.

## Why the We-Vibe precedent is in here

It is not there to alarm. It is there because it is the one **documented, settled** case in this
category — researchers found undisclosed data collection in 2016, and the manufacturer settled a class
action for roughly $3.2M in March 2017. It establishes that this is a real category of exposure rather
than a hypothetical one, which is the reason to actually read a device's privacy policy before
connecting an account. It says nothing about how any specific device behaves today.

