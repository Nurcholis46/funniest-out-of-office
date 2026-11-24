import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// One line: the funniest out-of-office auto-reply.
// Chosen against the judge's brief, in its own order: it opens with the
// exact words a real person sets ("I'm out of office until Monday"), so
// it reads as a genuine auto-reply, not a joke pasted into one; it turns
// on a genuine surprise — the inbox does not sit idle or get handed to a
// colleague, it applies for the sender's own job — and then escalates
// twice more in the same breath (interviewed itself, got the promotion),
// so the laugh keeps building to the last words instead of spending
// itself on a single twist; it sounds like a person with a voice, dry
// and self-deprecating about being replaceable, rather than a template
// with a punchline bolted on; it stays fresh, steering clear of the
// thousand-inbox clichés (gone fishing, full inbox, bother someone else,
// the cat ate the email); and it uses every word — 108 characters, the
// triple escalation doing the work of a setup and a punchline at once,
// with nothing left to cut.
// Alternatives weighed and set aside: a toddler variant ("my toddler ...
// replied to your email with a crayon drawing of a dinosaur") is warm
// and visual, but the kid-answers-the-email trope is already familiar,
// so it smiles where the promotion line laughs; an inbox-union variant
// ("My inbox has unionised, and its first demand is that you stop
// emailing.") is punchy but spends its whole joke on one beat, while the
// promotion line earns three; a rumour variant ("my inbox ... has already
// started a rumour that I have been fired") lands its twist on a rumour
// rather than an event, so it reads as a quip about the inbox instead of
// the inbox actually taking the job. The promotion keeps the joke in the
// sender's own working life and puts the twist in the last few words, so
// it stands.
const text =
  "I'm out of office until Monday — my inbox has applied for my job, interviewed itself, and got the promotion.";

// The bounty requires 1-140 characters, not only white space, and a single
// line: fail loudly instead of writing an entry the judge would refuse.
// The gate is strict on purpose — the entry file must be exactly this one
// line, byte for byte: no carriage return (a second kind of line break),
// no leading or trailing padding (the judge reads the file as submitted),
// and no control characters.
const codePoints = [...text].length;
if (codePoints < 1 || codePoints > 140 || text.trim().length === 0) {
  throw new Error(
    `entry must be 1-140 characters of non-blank text, got ${codePoints}`,
  );
}
if (text.includes("\n") || text.includes("\r")) {
  throw new Error("entry must be a single line");
}
if (text !== text.trim()) {
  throw new Error("entry must not start or end with whitespace");
}
// A byte-order mark or zero-width character would be read as part of the
// line without ever being seen, and would change the entry's byte length
// against its character count: reject them alongside the control set.
if (/[\u0000-\u001f\u007f\u2028\u2029\ufeff\u200b-\u200d]/.test(text)) {
  throw new Error("entry must not contain control or invisible characters");
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", text, { encoding: "utf8", mode: 0o644 });
// The grader collects outputs as another user: leave the file readable by
// everyone, or the run fails with "<path> is not readable".
chmodSync("/output/entry.txt", 0o644);

// Read it back and prove the file on disk is exactly the line: a write
// that silently truncated, re-encoded or padded the entry would otherwise
// ship a different text to the judge than the one gated above.
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== text) {
  throw new Error("entry file does not match the gated line");
}
// The file must end exactly at the last character: a trailing newline
// would make the entry two lines to a reader that counts lines, and the
// equality check above would already have caught it — this asserts the
// invariant on its own so a future edit that relaxes the write cannot
// silently reintroduce it.
if (written.endsWith("\n") || written.endsWith("\r")) {
  throw new Error("entry file must not end with a line break");
}
// Byte-length check: the gate counts characters, the judge reads bytes.
// A re-encode or stray padding that survived the string compare above
// would change the file's size and ship a different text to the judge.
if (Buffer.byteLength(written, "utf8") !== Buffer.byteLength(text, "utf8")) {
  throw new Error("entry file byte length does not match the gated line");
}
