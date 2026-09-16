/**
 * Replace seoSections in en.json / zh.json with expanded article copy.
 * Run: node scripts/inject-seo-content.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const en = {
  home: [
    {
      title: "What actually goes wrong when you copy from a PDF",
      body: [
        "PDF was designed to freeze a page, not to give you a document you can keep editing. That is why copying from a viewer feels broken even when the file looks perfect on screen. Lines wrap in the middle of sentences. Headings arrive as slightly larger body text. A two-column paper comes out as left column, then right column, in the wrong reading order. Tables collapse into a pile of spaces and tabs. Hyphenated words at the end of a line stay split. Headers, footers, and page numbers repeat between every section.",
        "Those artifacts are not just ugly. They break search, they confuse language models, and they make a 20-page handbook take an afternoon to clean. PDF to Markdown is useful when you want the opposite of a frozen page: headings that are real headings, lists that are lists, and text you can diff, quote, or republish without fighting the layout engine.",
      ],
      items: [
        {
          title: "Broken reading order",
          body: "Multi-column magazines, academic papers, and slide-like PDFs often store text in drawing order, not reading order. A converter that rebuilds blocks into Markdown will not be perfect, but it gives you a starting outline instead of a shuffled paste.",
        },
        {
          title: "Invisible structure",
          body: "In the PDF, a title is just a font size. In Markdown, a title is # or ##, which tools can outline, link to, and chunk. Recovering that hierarchy is the difference between a wall of text and a document you can navigate.",
        },
        {
          title: "Tables and code that stop being data",
          body: "A table copied from a PDF is usually not a table anymore. Code samples pick up line numbers, stray spaces, and wrapped statements. Getting closer to fenced code and pipe tables is what makes the export worth editing instead of retyping.",
        },
      ],
    },
    {
      title: "Where PDF to Markdown shows up in real work",
      body: [
        "The pattern is the same across jobs: someone else published a PDF, and you need the words inside it to travel. That destination might be a prompt window, a Git repo, a wiki, a translation memory, or a personal knowledge base. The PDF itself stays the archive; Markdown becomes the working copy.",
      ],
      items: [
        {
          title: "Research notes that you can actually search",
          body: "Papers, whitepapers, and industry reports are still distributed as PDF. Researchers paste a chapter into Obsidian, Notion, or a local vault, highlight claims, and link them to other notes. Markdown keeps citations and headings intact enough to annotate. A locked PDF does not.",
        },
        {
          title: "Feeding models without feeding layout junk",
          body: "RAG pipelines and long-context chats both degrade when the input is full of running headers and split words. Turning a text-based PDF into Markdown first gives you cleaner chunks: one heading plus the paragraphs under it, instead of page 14's footer glued to page 15's first sentence. That matters for retrieval quality as much as for the prompt you paste by hand.",
        },
        {
          title: "Handbooks that have to live in Git",
          body: "Engineering specs, API manuals, and compliance PDFs often start life in Word or FrameMaker and ship as PDF. Teams that want pull requests, blame, and review comments need a text format. Markdown is the format those teams already know how to review.",
        },
        {
          title: "Support, sales, and operations reuse",
          body: "A pricing sheet, an onboarding packet, or a policy PDF gets quoted in tickets every week. Converting it once means the next person can copy a section, update a number, and republish—rather than screenshotting page 7 again.",
        },
        {
          title: "Translation and localization drafts",
          body: "Translators would rather work on paragraphs than on a visual page. Markdown gives a bilingual reviewer something they can put in a diff tool. The original PDF can stay the signed artifact; the Markdown is the draft that moves through CAT tools and reviewers.",
        },
        {
          title: "Turning a PDF back into a web page",
          body: "Documentation sites, GitBook, Docusaurus, and Hugo all want Markdown sources. If the only copy of a guide is a PDF export from three years ago, conversion is how you stop maintaining a dead format.",
        },
      ],
    },
    {
      title: "How to get a cleaner conversion",
      body: [
        "No in-browser converter can invent text that is not in the file. A scanned book, a photographed whiteboard, or a PDF that is only images will come out empty or garbled until you run OCR. Start with a file where you can select a sentence in Preview or Chrome; that is the signal that real text exists.",
        "After conversion, treat the Markdown as a draft. Skim the outline first. If every line became a heading, or no headings survived, fix the hierarchy before you polish wording. Then look at tables, code fences, and lists. Those are the spots where layout usually lies.",
      ],
      items: [
        {
          title: "Prefer a text-based export from the original tool",
          body: "If you still have the Word, Google Doc, or design source, export a text PDF instead of a flattened print file. Selectable text converts; outlines of letters drawn as paths do not.",
        },
        {
          title: "Watch repeating chrome",
          body: "Headers, watermarks, and page numbers often leak into the Markdown as extra paragraphs. Delete them once at the top of the file, then scan for the same line repeating between sections.",
        },
        {
          title: "Keep private files in the browser",
          body: "Contracts, medical notes, and unreleased specs should not go to an upload-first converter just to become text. This tool reads the PDF locally, which is the safer default when you do not control the other party's server.",
        },
      ],
    },
  ],
  mdToPdf: [
    {
      title: "Markdown is the draft. PDF is still the envelope.",
      body: [
        "People write in Markdown because it is fast, versionable, and easy to paste out of an AI chat. They still send PDFs because the other side did not ask for a .md file. Hiring managers want a resume they can print. Finance wants a one-pager that will look the same in email. A professor wants a lab report that does not reflow when opened on a phone. Government portals and many vendors still only accept PDF uploads.",
        "MD to PDF exists for that last mile. You keep writing in a format you can edit. When the wording is done, the browser's print dialog freezes the layout into a file you can attach. You do not need Word, and you do not need to upload the draft to a conversion API to get a portable document.",
      ],
      items: [
        {
          title: "Weekly notes that have to look finished",
          body: "Meeting notes, incident reviews, and status reports start as Markdown in a vault or a chat. Exporting them as PDF is how they enter a thread with people who will never open VS Code. The live preview is there so you catch a broken table before that thread starts.",
        },
        {
          title: "AI output you need to archive",
          body: "A long answer from ChatGPT or Claude is Markdown in the clipboard. If you need a snapshot for a ticket, a client, or a compliance folder, saving that snapshot as PDF is more stable than hoping the chat history stays available. Preview first: models love to emit headings and code fences that look different once they are actually rendered.",
        },
        {
          title: "READMEs, RFCs, and handbooks leaving Git",
          body: "Internal design docs live in the repo. Occasionally they have to leave: a partner review, a printout for a workshop, an attachment for a change-advisory board. Markdown to PDF is the export path that does not require rebuilding the document in Google Docs.",
        },
        {
          title: "Round-tripping with PDF to Markdown",
          body: "Some teams receive a PDF, convert it to Markdown, edit the source, and export a new PDF. That loop only works if both ends are in the browser and you can see the rendered page before you save.",
        },
      ],
    },
    {
      title: "What makes a Markdown file print well",
      body: [
        "The print dialog will faithfully reproduce whatever the preview shows, including mistakes. A document full of bold-as-headings, HTML copied from a CMS, and tables with twenty columns will look cramped on A4. A few writing habits produce more predictable pages.",
      ],
      items: [
        {
          title: "Use real heading markers",
          body: "Write #, ##, and ### instead of enlarging a paragraph with bold. Headings create visual rhythm on the page and give you an outline. They also survive if you later convert the PDF back to Markdown.",
        },
        {
          title: "Keep tables narrow enough to print",
          body: "GitHub-style pipe tables work. Tables that are really spreadsheets do not. If a row cannot fit, split the table or turn extra columns into a list under each item. Check the preview at a width close to a printed page, not only on a wide monitor.",
        },
        {
          title: "Fence code, then glance at wrapping",
          body: "Long command lines wrap in print even when they looked fine in the editor. Break them, or accept that the PDF will show wrapped code. Either decision is better than discovering it after you emailed the file.",
        },
        {
          title: "In the dialog, save as PDF—not as a printer",
          body: "Chrome, Edge, and Safari all expose a destination named Save as PDF or similar. That is the option that writes a file. Sending the job to a physical printer is a different outcome. Margins and headers in the print UI are worth a five-second check; they are how you drop the default “page 1 of 4” chrome if you do not want it.",
        },
      ],
    },
    {
      title: "Why the conversion stays in your browser",
      body: [
        "A cloud MD-to-PDF API is convenient until the document contains customer names, unreleased numbers, or a draft you do not want logged. Rendering the page locally and printing it locally means the bytes never have to sit on someone else's disk just to become a PDF. There is no account, no watermark, and no queue behind a shared server.",
        "The tradeoff is that page breaks follow your browser's print engine. That is the same engine you already use for everything else on the web. If a heading is stranded at the bottom of a page, add a blank line or shorten the previous section in the Markdown—then print again. You are editing a document, not waiting on a remote layout job.",
      ],
    },
  ],
  pdfToJpg: [
    {
      title: "Most people do not need another PDF. They need a picture of a page.",
      body: [
        "PDFs are awkward in the places where work actually happens. WeChat and many internal IM clients show a generic file chip instead of the page. Slack and email threads get noisy when every reply re-attaches a 40-page deck. A designer asked for “the cover and the chart on page 6.” A QA engineer needs the error dialog that only exists on page 12 of a test report. None of those people wanted the full document. They wanted pixels.",
        "PDF to JPG (or PNG) is the straightforward answer: pick the pages, pick a format, download images. Doing it in the browser means the file never goes to a conversion farm, which is the difference between sharing a screenshot of a public flyer and sharing a screenshot of a contract.",
      ],
      items: [
        {
          title: "Chat, tickets, and “can you send that page?”",
          body: "Support tickets, incident channels, and vendor chats all work better with an image. The other person can see the invoice total or the broken UI without downloading software. Exporting one page is faster than teaching someone how to open a PDF on their phone.",
        },
        {
          title: "Slides and reports as reusable assets",
          body: "A page of a pitch deck becomes a LinkedIn image, a Notion embed, or a figure in another document. Course handouts become slides in a different tool. Product one-pagers become website graphics. Once each page is a file, you can drop it anywhere an image is accepted.",
        },
        {
          title: "Only the pages that matter",
          body: "Signature pages, appendices, maps, and certificates are often a few leaves inside a long PDF. Page ranges such as 1-3,8 exist so you are not rasterizing a 200-page manual to grab the cover. Less work, smaller ZIP, fewer accidental leaks of pages you did not mean to send.",
        },
        {
          title: "Bug reports and visual QA",
          body: "When a PDF itself is the product—statements, generated reports, print previews—you sometimes need to attach how a page looks, not the file. An image in a bug ticket is unambiguous. The developer does not have to install the same font to see what you saw.",
        },
        {
          title: "Thumbnails, covers, and social crops",
          body: "Ebook covers, whitepaper heroes, and event posters still travel as PDF from the design team. Marketing needs a JPG for CMS fields that reject PDF. A high-quality raster of page 1 is usually enough.",
        },
      ],
    },
    {
      title: "JPG or PNG is a choice about what you are afraid of losing",
      body: [
        "JPG is a photograph format. It is small, and it is lossy. Fine for mixed pages, photos, and anything that will be compressed again by a chat app. Soft type and flat UI chrome can pick up smudges or ringing if you push the quality too low.",
        "PNG is a screenshot format. Edges stay sharp, text stays readable, diagrams do not grow JPEG blocks. Files are larger. That is the right trade when the page is a table, a terminal capture, a flowchart, or anything a reader will pinch-zoom. If you are not sure, export one page both ways and keep the one you would actually send.",
      ],
      items: [
        {
          title: "Quality presets are about pixels, not magic",
          body: "Standard, high, and ultra change how densely each page is rasterized. Higher looks better when someone zooms; it also makes a heavier ZIP. For a chat preview, high is usually enough. For a poster or a screenshot you might crop later, ultra wastes less of the original page.",
        },
        {
          title: "Nothing is uploaded to make the image",
          body: "The PDF is read on your machine, pages are drawn on your machine, and the JPG or ZIP is saved to your downloads. That is slower on a huge scan and much safer on a file you would not put in a random converter's queue.",
        },
      ],
    },
  ],
  mdViewer: [
    {
      title: "Markdown is still just text. Preview is how you see the document hiding in it.",
      body: [
        "Markdown started as a way to write HTML without writing HTML. A heading is a #, emphasis is asterisks, a link is a pair of brackets. The file stays readable in a terminal, in a diff, and in email. GitHub, GitLab, Obsidian, Notion importers, static site generators, and almost every AI assistant standardized on it because humans can still parse the source when the renderer is missing.",
        "The catch is that the source is not the document. A missing space after ##, an unclosed fence, or a table row with the wrong number of pipes will look fine as text and wrong as a page. An MD viewer is the cheap way to notice that before you open a pull request, publish a post, or paste the draft into a chat with your name on it.",
      ],
      items: [
        {
          title: "Write and check in the same window",
          body: "Split view exists because Markdown errors are local. You see a list that refused to nest, you fix the indent, the preview updates. Hiding the editor is for reading: a README, a dumped AI answer, a note you were sent as a .md attachment.",
        },
        {
          title: "Open the file you already have",
          body: "Most Markdown does not start in a browser. It starts in a repo, an export, or a vault. Opening a local .md, skimming the outline, and downloading the edited copy is the whole loop when you do not want to install another editor for a five-minute check.",
        },
        {
          title: "Numbered citations for drafts that quote the web",
          body: "Research-style notes often accumulate [title](url) links until the paragraph is unreadable. Turning those links into [1], [2] in the preview—and listing the URLs underneath—is for that case. The source can keep the original links; the reading view becomes closer to a paper.",
        },
      ],
    },
    {
      title: "The messy middle between AI output and something you can ship",
      body: [
        "Language models answer in Markdown because it is a convenient default: headings, bullets, fenced code, the occasional table. That output is a first draft, not a document. Fences get labeled with the wrong language. Nested lists skip a level. Tables are missing a separator row. A “References” section duplicates links that already appeared inline.",
        "Pasting the answer into a live preview is faster than mentally simulating GitHub Flavored Markdown. It is also how you decide the next tool: stay here and edit, send the source to MD Diff against an older version, or export with MD to PDF when someone needs an attachment. The viewer is the inspection step, not the whole publishing chain.",
      ],
      items: [
        {
          title: "PR descriptions and READMEs",
          body: "Git hosts render Markdown, but they render it after you press comment. Previewing locally means you are not the person who submitted a broken table in a design doc. The same applies to issue templates and wiki pages.",
        },
        {
          title: "Notes, wikis, and personal knowledge bases",
          body: "Obsidian, Logseq, and a pile of smaller apps speak Markdown dialects. A browser preview will not clone every plugin, but it will tell you whether the portable subset—headings, lists, tables, code, quotes—survives outside your vault. That is the subset you can email, commit, or convert.",
        },
        {
          title: "Docs platforms and static sites",
          body: "Docusaurus, MkDocs, VitePress, Hugo, and GitBook all compile Markdown to pages. Authors who do not have the site running still need to see whether an admonition-free draft looks coherent. The viewer covers that common core so you are not editing blind in a CMS box.",
        },
      ],
    },
    {
      title: "A working subset of Markdown worth remembering",
      body: [
        "You do not need the whole CommonMark spec to write useful documents. The patterns below are the ones that fail most often in previews, and the ones every GFM renderer is expected to understand. Spaces matter more than people expect: #Heading is not a heading, and -item is not a list.",
      ],
      items: [
        {
          title: "Headings and thematic breaks",
          body: [
            "Start a line with one to six # characters, then a space, then the title. Use the levels to outline, not to style: one H1 per document is enough. A line of --- can separate sections when a heading would be too loud.",
          ],
        },
        {
          title: "Emphasis, inline code, and fences",
          body: [
            "Wrap a word in *single asterisks* or _underscores_ for italics, and **two** for bold. Inline code uses single backticks. Anything you would paste into a terminal belongs in a fenced block: three backticks, an optional language tag, then the code, then three backticks to close. Unclosed fences eat the rest of the file. That is the usual reason a preview “goes blank” after a certain line.",
          ],
        },
        {
          title: "Lists, tasks, and quotes",
          body: [
            "Unordered lists start with - or * and a space. Ordered lists start with 1. and a space; the number you type is less important than the marker. Nested items need a consistent indent. Task-style items (- [ ] and - [x]) render as lists here even when they are not interactive checkboxes. Quotes start with > and can wrap multiple paragraphs if each line is prefixed.",
          ],
        },
        {
          title: "Links, images, and tables",
          body: [
            "A link is [visible text](https://example.com). An image is the same idea with a leading bang: ![short description](https://example.com/chart.png). Tables need a header row, a separator row of dashes, and body rows, all split by pipes. If one row has fewer cells than the header, the preview will look jagged—count the pipes before you blame the renderer.",
          ],
        },
      ],
    },
  ],
  mdDiff: [
    {
      title: "Two Markdown files can look the same and still not be the same document",
      body: [
        "A generic text diff will tell you that a space moved. It will not tell you that a heading was demoted, that a list became a paragraph, or that a link label stayed put while the URL changed. Markdown is a presentation language sitting on top of plain text. Reviewing only the characters is how a “minor rewrite” ships with a missing disclaimer or a reordered procedure.",
        "MD Diff is for the moment you have two drafts—an original and a rewrite—and you need to see both the reading experience and the source. Preview mode is for structure: did the argument still flow, did the table survive, did the citations remain. Source mode is for the line-level add and delete coloring you already know from Git, with line numbers you can point to in a review comment.",
      ],
      items: [
        {
          title: "What an AI rewrite actually changed",
          body: "Models paraphrase confidently. They also invent sections, drop caveats, and “helpfully” rewrite quoted text. Putting the original Markdown on the left and the model output on the right is the fastest way to see those edits as edits, not as a new essay you have to re-read from scratch.",
        },
        {
          title: "Documentation pull requests without checking out the branch",
          body: "README updates, runbooks, and style guides are Markdown. Pasting HEAD and the proposed file into a side-by-side view is useful when you are reviewing from a browser, when the change is in an email, or when the two versions never lived in the same repo.",
        },
        {
          title: "Translation and localization review",
          body: "A translated Markdown page should keep heading depth, list length, and link targets aligned with the source. Diffing the two files will not grade the prose, but it will catch a missing step in a procedure, a dropped table column, or a link that still points at the English anchor.",
        },
        {
          title: "Legal-ish drafts that cannot skip a clause",
          body: "Privacy policies, terms, and internal policies often start as Markdown even when they ship as PDF. Comparing versions side by side is how you confirm a paragraph moved rather than vanished. Citation counts on each pane are a second check when the document is built out of referenced URLs.",
        },
      ],
    },
    {
      title: "How to read a Markdown diff without getting lost",
      body: [
        "Start in preview. If the outline jumped, fix the headings before you argue about wording. Then switch to source for the hunks that matter: a list that changed length, a table row, a code sample, a URL. Ignore whitespace-only churn if you can; if one side was auto-formatted, normalize that first so the coloring is about meaning.",
        "When a whole section shows as deleted and re-inserted, it probably moved. Confirm the content still exists, then look at the neighbors to see whether the move broke a numbered procedure. Line numbers are there so you can say “modified, line 84” instead of quoting a paragraph into chat.",
      ],
    },
  ],
  jsonViewer: [
    {
      title: "JSON is fine until it is one line, or wrong, or both",
      body: [
        "APIs return minified objects. Config files accumulate nested keys until nobody can see which brace closes which feature flag. Language models emit “JSON” that is almost valid: a trailing comma, a comment, a single-quoted string, an unescaped newline inside a value. Log pipelines dump entire payloads as escaped strings. In all of those cases you do not need a new editor as much as you need a place that will parse, point at the error, and let you look around.",
        "This JSON viewer stays in the browser on purpose. Production tokens, customer records, and staging secrets show up in JSON more often than people admit. Formatting that payload should not require pasting it into a random website that might log the body.",
      ],
      items: [
        {
          title: "API responses you cannot read in the network panel",
          body: "DevTools will pretty-print, but it will not let you delete a noisy key, minify a subset, or save a fixture. Paste the body here when you are turning a live response into a test case, or when you need to send a colleague the shape without the auth header still sitting in the screenshot.",
        },
        {
          title: "Config, manifests, and infrastructure files",
          body: "package.json, appsettings, Terraform JSON, and workflow payloads are all the same problem at different scales: nested maps that you need to expand one branch at a time. Tree view is for navigation. Formatted view is for reading a full file you are about to commit.",
        },
        {
          title: "Tool calls and structured model output",
          body: "Agents pass arguments as JSON. When a call fails, the reason is often a type that should have been a string, a missing field, or a blob of Markdown stuffed into a value. Inspecting the payload as a tree is quicker than counting brackets in the trace UI. If the model wrapped JSON inside a string, unescape first so you are looking at the inner object.",
        },
        {
          title: "When the file is “JSON” but will not parse",
          body: "The viewer tells you that the input is invalid, and if the engine knows the position, it tells you the line and column. Format and minify stay disabled until the document is actually JSON. That is deliberate: pretty-printing invalid input would invent a structure that is not there.",
        },
      ],
    },
    {
      title: "Formatted, minified, and tree are three jobs",
      body: [
        "Formatted JSON is for reading and for diffs against other pretty-printed files. Minified JSON is for pasting into an environment variable, a CLI flag, or a size-sensitive request. Tree view is for exploring: expand one object, collapse the rest, delete a key you do not want in a sample. Hovering a line to remove a property is how you shrink a production dump down to the fields a bug report actually needs.",
        "Large documents may skip the tree and stay in formatted view. That is a limit of running in the browser, not a prompt to upload the file somewhere else. Copy or download when you are done; the source on the left stays in sync with edits you make in the tree.",
      ],
    },
  ],
  textReplacer: [
    {
      title: "The \\n you see is often not a newline",
      body: [
        "When a program wants a line break inside a string, it writes a backslash and an n. JSON does this. Many logs do this. Chat exports, CSV cells, error messages copied out of a browser, and code-generated prompts do this. What lands on your clipboard is four characters of meaning compressed into two glyphs: \\n. If you paste that into a notes app, you get a single crushed paragraph with the symbols still visible. Nothing is “wrong” with the text. It is just still escaped.",
        "The same thing happens with tabs (\\t), Windows line endings (\\r\\n), and doubled backslashes from logs that escaped an already escaped string. A text replacer that can interpret those sequences is how you get a document back: real line breaks, real columns, a stack trace you can read. The reverse job exists too—turning a readable draft back into a JSON string—because the next system in the pipeline may only accept the escaped form.",
      ],
      items: [
        {
          title: "JSON strings, API samples, and copied payloads",
          body: "You extract a field that looks like \"Hello\\nWorld\" and want it to display as two lines. Literal find of \\n, with interpret-escapes on the replacement, is the direct path. People hit this constantly when they copy a value out of a JSON viewer, a Swagger UI, or a log line that quoted the body.",
        },
        {
          title: "Logs that arrived as one row",
          body: "Collectors and SIEM exports like to keep an event on a single line. Newlines inside the message get escaped so the file stays one record per row. To read the exception, you need those escapes turned back into breaks. Doing it in the browser is safer than sending the dump to an online “formatter” that will store it.",
        },
        {
          title: "Chat, CSV, and spreadsheets",
          body: "Excel and Google Sheets will show a cell that contains line breaks as a single wrapped box, then copy it with \\n or with real breaks depending on the app. Chat backups from Slack, Teams, or WeChat often flatten messages. A pass of replacement is cheaper than cleaning 400 rows by hand.",
        },
        {
          title: "The other direction: encode newlines for code",
          body: "Sometimes you wrote a readable prompt or an email, and now you need it inside a JSON file, a YAML literal, or a unit-test string. Converting real line breaks to \\n (and tabs to \\t) is the encode preset. Without it, the JSON you paste will not parse.",
        },
      ],
    },
    {
      title: "Replacement is also how messy text becomes a draft",
      body: [
        "Not every job is about escapes. Product names change. Staging URLs have to become production URLs. A model wrote “Acme Corp” thirty times and legal wants the real entity. You have a list of IDs in brackets and want them wrapped as markdown links. Find and replace with a live count is the small tool people still open a whole IDE to get.",
      ],
      items: [
        {
          title: "Prompt and output cleanup",
          body: "Models emit odd spacing, doubled headings, or HTML entities in otherwise Markdown text. A few literal replacements—straightening quotes, stripping a repeated signature, turning three blank lines into one—make the draft editable before you move it into the MD viewer.",
        },
        {
          title: "Bulk wording in a pasted document",
          body: "When the “document” is already on the clipboard, opening Word is overhead. Paste, replace the old brand name or the old API host, glance at the replacement count, copy back. Ignore-case is there because marketing copy is inconsistent about capitalization.",
        },
        {
          title: "Regex when the pattern is the point",
          body: [
            "Literal find cannot express “every run of digits” or “the text inside the last pair of quotes.” JavaScript regular expressions can. Capture groups and $1 / $2 in the replacement are how you wrap, reorder, or extract without writing a script. Greedy matching is the default because that is how JS works; turn it off when .* is eating too much and you wanted the shortest match.",
            "Regex mode changes the meaning of \\n in the find box: it becomes a real newline, not the two characters backslash and n. If you still need to find the escaped form, search for \\\\n. That distinction is the usual source of “it didn't match anything.”",
          ],
        },
      ],
    },
    {
      title: "Check the options before you trust the output",
      body: [
        "Find is literal unless you say it is a regex. Replacement inserts what you typed unless you ask it to interpret escapes. Those two switches are independent, which is powerful and easy to mis-set. The live result on the right is the ground truth—watch the count as well as the text. If the count is 0, your find string does not occur. If the count is huge, you may have enabled regex with a pattern that matches empty positions.",
      ],
      items: [
        {
          title: "Literal find is the safe default",
          body: "With literal find, \\n is a backslash followed by n. That is what you want for JSON-style dumps. Enable regex only when you intend . * + ? and character classes to have meaning. A forgotten regex toggle is how a dot in an IP address starts matching any character.",
        },
        {
          title: "Interpret escapes only where you need them",
          body: "On the replacement side, interpret-escapes turns \\n into a real line break, \\t into a tab, \\r into a carriage return, and \\\\ into a single backslash. Leave it off when you want those characters to stay visible in the output.",
        },
        {
          title: "Greedy vs lazy is a regex-only problem",
          body: ".* matches as far as it can. If you are wrapping HTML-ish fragments or quoted strings and the replacement swallowed half the file, disable greedy matching (or write .*? yourself). Literal mode ignores the switch, because there are no quantifiers.",
        },
      ],
    },
  ],
};

const zh = {
  home: [
    {
      title: "从 PDF 里复制，到底会坏在哪里",
      body: [
        "PDF 的目标是把一页纸冻住，不是给你一份还能继续改的文档。所以哪怕屏幕上看着排版完美，复制出来仍常常是碎的：句子在行中断开，标题变成稍微大一点的正文，双栏论文先倒出左栏再倒出右栏、阅读顺序错乱，表格塌成一堆空格和 Tab，行末被连字符切开的词再也不拼回去，页眉页脚和页码夹在每一节中间反复出现。",
        "这些不只是难看。它们会让搜索失效，让语言模型读进一堆版式垃圾，也会把一本 20 页手册变成一下午的手工清理。PDF 转 Markdown 要的是相反的东西：标题是真标题，列表是列表，文本可以拿去对比、引用、再发布，而不必再跟排版引擎搏斗。",
      ],
      items: [
        {
          title: "阅读顺序是画出来的，不是读出来的",
          body: "杂志、学术论文、幻灯片式 PDF，文字往往按绘制顺序存储，而不是按眼睛的阅读顺序。转换器把区块重组成 Markdown，不会百分百正确，但至少给你一份能改的大纲，而不是一段被打乱的粘贴。",
        },
        {
          title: "结构在 PDF 里是看不见的",
          body: "在 PDF 里，标题只是字号更大。在 Markdown 里，标题是 # 或 ##，工具可以据此生成目录、锚点和切块。能不能找回层级，决定了你得到的是一堵墙，还是一份能导航的文档。",
        },
        {
          title: "表格和代码不再是数据",
          body: "从 PDF 复制出来的表，通常已经不是表。代码会带上行号、莫名空格、被强制折行的语句。更接近围栏代码和管道表格，转换才值得继续改，而不是从头手打。",
        },
      ],
    },
    {
      title: "真实工作里，谁在把 PDF 变成 Markdown",
      body: [
        "各行各业的模式其实一样：别人发布的是 PDF，而你需要里面的字继续往前走。目的地可能是提示词窗口、Git 仓库、wiki、翻译记忆库，或个人知识库。PDF 继续当档案，Markdown 成为工作副本。",
      ],
      items: [
        {
          title: "研究笔记要能搜、能链",
          body: "论文、白皮书、行业报告至今仍以 PDF 发放。研究者把某一章贴进 Obsidian、Notion 或本地仓库，标出论断，再链到其他笔记。Markdown 能把引用和标题留到足够能批注的程度；锁死的 PDF 做不到。",
        },
        {
          title: "给模型喂内容，而不是喂版式",
          body: "RAG 和长上下文对话都会被页眉、页码、被切开的词拖垮。先把文字型 PDF 转成 Markdown，切块会干净得多：一个标题加上它下面的段落，而不是第 14 页页脚黏在第 15 页第一句上。手工粘贴提示词时如此，检索质量也同样如此。",
        },
        {
          title: "必须活在 Git 里的手册",
          body: "工程规格、API 手册、合规 PDF，常常从 Word 或排版软件起步，最后只留下 PDF。想要 pull request、blame 和评审意见，就需要文本格式。Markdown 是这些团队已经会审的格式。",
        },
        {
          title: "支持、销售、运营的反复引用",
          body: "价目表、入职包、制度 PDF，每周都会在工单里被摘抄。转一次，意味着下一个人可以复制某一节、改一个数字再发布——而不是第七页再截一次图。",
        },
        {
          title: "翻译和本地化草稿",
          body: "译者更愿意面对段落，而不是面对一页视觉稿。Markdown 让双语审校可以放进 diff 工具。签字版可以继续是 PDF；在 CAT 和审校之间流动的，是 Markdown 草稿。",
        },
        {
          title: "把 PDF 重新变回网页",
          body: "文档站、GitBook、Docusaurus、Hugo 都要 Markdown 源稿。如果一份指南只剩三年前导出的 PDF，转换就是停止维护一种死格式的方法。",
        },
      ],
    },
    {
      title: "怎样让转换结果更干净",
      body: [
        "浏览器里的转换器变不出文件里没有的字。扫描书、拍下来的白板、整页都是图片的 PDF，在做 OCR 之前只会是空白或乱码。先在系统预览或 Chrome 里试着选中一句：能选中，说明真有文字。",
        "转换之后，把 Markdown 当草稿。先扫大纲。如果每一行都变成了标题，或标题全部消失，先修层级再改措辞。然后看表格、代码围栏和列表——版式最爱在这些地方说谎。",
      ],
      items: [
        {
          title: "能从原软件导出文字版，就不要用扁平打印件",
          body: "如果还留着 Word、Google 文档或设计源文件，请导出可选中文字的 PDF。可选文字才能转；被画成路径的轮廓字母不能。",
        },
        {
          title: "注意反复出现的页眉页脚",
          body: "页眉、水印、页码常常漏进 Markdown，变成多余段落。先在文首删一次，再扫各节之间是否重复同一行。",
        },
        {
          title: "私密文件留在浏览器里处理",
          body: "合同、病历、未发布的规格，不该只为了变成文本就上传到陌生转换站。本工具在本地读取 PDF，在你无法控制对方服务器时，这是更稳妥的默认选择。",
        },
      ],
    },
  ],
  mdToPdf: [
    {
      title: "Markdown 是草稿，PDF 仍是信封",
      body: [
        "人们用 Markdown 写，是因为它快、能进版本库、也能从 AI 对话里直接粘出来。人们仍然寄 PDF，是因为对方没跟你要 .md。招聘要一份能打印的简历，财务要一页在邮件里看起来不变样的说明，老师要实验报告在手机上打开也不重排，政务和不少供应商的上传口至今只收 PDF。",
        "MD 转 PDF 就是这最后一公里：继续用你能改的格式写；措辞定了，再用浏览器打印对话框把版式冻成附件。不必打开 Word，也不必为了得到一份可携带的文件，把草稿上传到转换 API。",
      ],
      items: [
        {
          title: "必须看起来像定稿的周报和纪要",
          body: "会议纪要、故障复盘、进度报告，往往从笔记库或聊天里的 Markdown 开始。导出成 PDF，是它们进入「对方永远不会打开 VS Code」的线程的方式。实时预览就是为了在那条线程开始之前，先抓住一张坏掉的表。",
        },
        {
          title: "需要归档的 AI 输出",
          body: "ChatGPT 或 Claude 的长回答，剪贴板里就是 Markdown。若要为工单、客户或合规目录留一份快照，存成 PDF 比指望对话记录一直还在更稳。先预览：模型很爱输出标题和代码围栏，真正渲染后和想象中并不一样。",
        },
        {
          title: "README、RFC、手册离开 Git 的那一刻",
          body: "内部设计文档住在仓库里，偶尔必须离开：合作方评审、工作坊打印、变更评审会的附件。Markdown 转 PDF 是这条导出路径，而不必在 Google 文档里把全文重建一遍。",
        },
        {
          title: "和 PDF 转 Markdown 走一个来回",
          body: "有的团队收到 PDF，转成 Markdown，改源稿，再导出新的 PDF。两端都在浏览器里、保存前能看见渲染页，这个闭环才成立。",
        },
      ],
    },
    {
      title: "什么样的 Markdown 更经得起打印",
      body: [
        "打印对话框会忠实地再现预览里的一切，包括错误。满篇用加粗冒充标题、从 CMS 粘来的 HTML、二十列的表，到了 A4 上都会挤成一团。几个写作习惯，会让分页更可预期。",
      ],
      items: [
        {
          title: "用真正的标题标记",
          body: "写 #、##、###，而不是把一段话加粗当标题。标题在纸上形成节奏，也给你大纲。以后若再把 PDF 转回 Markdown，它们还在。",
        },
        {
          title: "表格要窄到能印出来",
          body: "GitHub 风格的管道表可以。本质是电子表格的表不行。一行盛不下，就拆表，或把多余列写成每条下面的列表。预览时看接近印刷页的宽度，而不只是超宽显示器。",
        },
        {
          title: "代码请围栏，并看一眼折行",
          body: "很长的命令行在编辑器里看着没事，打印时仍会折。要么主动断开，要么接受 PDF 里的折行。两种决定都比把文件寄出去之后再发现要好。",
        },
        {
          title: "对话框里选「存储为 PDF」，不是选打印机",
          body: "Chrome、Edge、Safari 都有名为「存储为 PDF」或类似的目标，那才会写出文件。发到实体打印机是另一回事。页边距和页眉页脚值得花五秒看一眼；不想要默认的「第 1 页，共 4 页」，就是在这里关掉。",
        },
      ],
    },
    {
      title: "为什么转换留在浏览器里",
      body: [
        "云端 MD 转 PDF 接口用起来省事，直到文档里出现客户姓名、未公开数字、或不想被记录的草稿。页面在本地渲染、在本地打印，意味着这些字节不必为了变成 PDF 而躺在别人的磁盘上。没有账号，没有水印，也没有卡在共享服务器后面的队列。",
        "代价是分页遵循你这台浏览器的打印引擎——和你在网上打印其它东西时是同一个。标题孤零零落在页底，就在 Markdown 里加空行或缩短上一段，再打一次。你是在改文档，而不是在等远端排版任务。",
      ],
    },
  ],
  pdfToJpg: [
    {
      title: "多数时候你要的不是另一份 PDF，而是某一页的图",
      body: [
        "真正干活的地方，PDF 常常很别扭。微信和不少内部 IM 只给一个文件卡片，看不到那一页。Slack 和邮件里每回都附上 40 页 PPT，线程会被撑爆。设计师说「封面和第 6 页那张图」。测试只需要报告第 12 页上的错误弹窗。他们都不要整份文档，他们要的是像素。",
        "PDF 转 JPG（或 PNG）就是直截了当的答案：选页，选格式，下载图片。放在浏览器里做，文件就不必进转换农场——这是分享一张公开海报，和分享合同某一页，之间的差别。",
      ],
      items: [
        {
          title: "聊天、工单，以及「把那一页发我」",
          body: "支持工单、故障群、供应商对话，用图更顺。对方不用装软件也能看见发票金额或坏掉的界面。导出一页，比教人在手机上打开 PDF 更快。",
        },
        {
          title: "幻灯片和报告变成可复用素材",
          body: "路演的一页可以变成 LinkedIn 图、Notion 嵌入、另一份文档里的插图。讲义可以进别的演示工具。产品一页纸可以进网站。每页都是文件之后，凡是能插图片的地方都能用。",
        },
        {
          title: "只要真正有用的几页",
          body: "签名页、附录、地图、证书，往往夹在很长的 PDF 里。1-3,8 这样的页范围，就是为了你不必把 200 页手册全部栅格化只为了封面。活更少，ZIP 更小，也不容易把不该发出去的页一起发出去。",
        },
        {
          title: "缺陷单和视觉验收",
          body: "当 PDF 本身就是产品——账单、生成的报表、打印预览——你有时要附上「这一页长什么样」，而不是文件本身。工单里的图没有歧义。开发也不必安装同一套字体才能看见你看见的东西。",
        },
        {
          title: "封面、缩略图、社交裁切",
          body: "电子书封面、白皮书头图、活动海报，设计侧仍常给 PDF。CMS 的字段拒收 PDF 时，市场需要 JPG。把第 1 页高质量栅格化，通常就够了。",
        },
      ],
    },
    {
      title: "选 JPG 还是 PNG，取决于你怕丢掉什么",
      body: [
        "JPG 是照片格式，体积小，有损。混排页面、照片、还要被聊天软件再压一次的图，用它合适。质量压太低时，细小的字和扁平界面容易起毛、出现色块。",
        "PNG 是截图格式。边缘利落，字仍可读，流程图不会长出 JPEG 方块。文件更大。页面是表格、终端截图、示意图，或读者会捏合放大时，就该用它。拿不准就同一页导两份，留下你真会发出去的那份。",
      ],
      items: [
        {
          title: "质量预设谈的是像素，不是魔法",
          body: "标准 / 高 / 超高，改变的是每一页栅格化有多密。更高意味着放大更好看，ZIP 也更沉。聊天预览用高通常够。可能还要裁切的海报或截图，用超高更少浪费原页细节。",
        },
        {
          title: "做图并不需要上传",
          body: "PDF 在你的电脑上读，页面在你的电脑上画，JPG 或 ZIP 存进下载。超大扫描件会慢一些；对你不愿丢进随机转换队列的文件，则安全得多。",
        },
      ],
    },
  ],
  mdViewer: [
    {
      title: "Markdown 仍然只是文本。预览，是看见藏在里面的那份文档",
      body: [
        "Markdown 一开始是为了不写 HTML 也能写 HTML：标题是 #，强调是星号，链接是一对方括号。文件在终端里、在 diff 里、在邮件里都还能读。GitHub、GitLab、Obsidian、Notion 的导入、静态站点生成器，以及几乎所有 AI 助手都把它当默认，因为渲染器不在时，人仍然能看懂源码。",
        "麻烦在于：源码并不是文档。## 后面少一个空格、围栏没闭合、表格某一行列数不对，当文本看都还过得去，当成页面就错了。MD 查看器是最便宜的发现方式——在你打开 pull request、发布文章、或把带自己名字的草稿贴进群之前。",
      ],
      items: [
        {
          title: "同一个窗口里写，也在同一个窗口里检查",
          body: "分栏存在，是因为 Markdown 的错误是局部的。你看见列表不肯嵌套，改缩进，预览马上变。藏掉编辑器是为了读：README、倒出来的 AI 回答、别人当附件发来的 .md。",
        },
        {
          title: "打开你已经有的那份文件",
          body: "多数 Markdown 并不从浏览器里长出来，而从仓库、导出、笔记库里来。打开本地 .md，扫一眼大纲，改完再下载——当你不想为五分钟的检查再装一个编辑器时，这就是全部循环。",
        },
        {
          title: "引用堆太多时，用编号来读",
          body: "研究型笔记常会堆一串 [标题](url)，段落变得没法读。预览里把这些链接收成 [1]、[2]，并在下方列出网址，就是为这种情况。源码可以保留原链接；阅读视图则更接近一篇论文。",
        },
      ],
    },
    {
      title: "AI 输出和可交付物之间，那截很脏的路",
      body: [
        "语言模型用 Markdown 作答，只因为它是方便的默认：标题、列表、围栏代码，偶尔一张表。那是初稿，不是文档。围栏会标错语言，嵌套列表会跳级，表会少分隔行，「参考文献」会和正文里已出现的链接重复。",
        "把回答贴进实时预览，比在脑子里模拟 GitHub Flavored Markdown 更快。这也是在决定下一步：留在这里改、拿去和旧版做 MD Diff，还是有人要附件时走 MD 转 PDF。查看器是检查这一步，不是整条发布链。",
      ],
      items: [
        {
          title: "PR 说明和 README",
          body: "代码托管平台会渲染 Markdown，但那是你按下评论之后。本地先预览，意味着你不会成为设计文档里提交了一张坏表的人。Issue 模板和 wiki 页面同样如此。",
        },
        {
          title: "笔记、wiki、个人知识库",
          body: "Obsidian、Logseq 和一堆更小的应用都说着各自的 Markdown 方言。浏览器预览不会克隆每个插件，但能告诉你可移植的那一截——标题、列表、表格、代码、引用——离开笔记库之后是否还在。能发邮件、能提交、能转换的，就是这一截。",
        },
        {
          title: "文档站和静态博客",
          body: "Docusaurus、MkDocs、VitePress、Hugo、GitBook 都会把 Markdown 编成页面。站点没跑起来的作者，仍需要知道一份不含自定义容器的草稿读不读得通。查看器覆盖这个公共核心，避免你在 CMS 小框里盲改。",
        },
      ],
    },
    {
      title: "一份够用的 Markdown 子集，值得记住",
      body: [
        "写有用的文档，用不到整部 CommonMark。下面这些是预览里最常失败、而每个 GFM 渲染器都应看懂的写法。空格比想象中重要：#Heading 不是标题，-item 不是列表。",
      ],
      items: [
        {
          title: "标题和分隔线",
          body: "一行以一到六个 # 开头，然后空格，然后标题。用层级来做大纲，而不是拿来当样式：一篇文档一个 H1 就够。需要分开两节、又不想再加标题时，可以用一行 ---。",
        },
        {
          title: "强调、行内代码、围栏",
          body: "一个词用 *单星号* 或 _下划线_ 变斜体，**两个**变粗体。行内代码用一对反引号。会贴进终端的东西，请放进围栏：三个反引号、可选的语言名、代码、再三个反引号闭合。围栏没关上，就会吞掉文件剩下的部分——预览从某一行之后「突然空白」，多半是这个原因。",
        },
        {
          title: "列表、任务项、引用",
          body: "无序列表以 - 或 * 加空格开头。有序列表以 1. 加空格开头；你写的数字不如标记本身重要。嵌套项缩进要一致。任务项（- [ ] 和 - [x]）在这里会当成列表渲染，即使不是可点的复选框。引用以 > 开头；多段引用则每行都加。",
        },
        {
          title: "链接、图片、表格",
          body: "链接是 [可见文字](https://example.com)。图片同一思路，前面加叹号：![简短说明](https://example.com/chart.png)。表格需要表头行、分隔行（一排短横线）、以及用竖线切开的表体。某一行的单元格少于表头，预览就会参差——先数竖线，再怪渲染器。",
        },
      ],
    },
  ],
  mdDiff: [
    {
      title: "两份 Markdown 可以长得像，却不是同一份文档",
      body: [
        "普通文本 diff 会告诉你空格挪了。它不会告诉你标题被降级、列表变成了段落、链接文字没变但 URL 换了。Markdown 是架在纯文本上的呈现语言。只审字符，就会让一次「小改写」带着缺失的免责声明或被重排的步骤上线。",
        "MD Diff 针对的是你手里有两份草稿——原文和改写——既要看阅读体验，也要看源码。预览模式看结构：论证还顺不顺、表还在不在、引用还在不在。原文模式则是你在 Git 里熟悉的增删着色，加上可以在评审里指给别人的行号。",
      ],
      items: [
        {
          title: "AI 改写到底动了什么",
          body: "模型改写时很自信。它们也会发明章节、丢掉限定条件、好心改掉引文。左边放原 Markdown，右边放模型输出，是把这些改动看成改动、而不是逼自己把一篇新作文从头读一遍的最快办法。",
        },
        {
          title: "不必检出分支，也能审文档 PR",
          body: "README、runbook、风格指南都是 Markdown。把 HEAD 和拟发布的文件贴进并排视图，适合人在浏览器里审、改动来自邮件、或两个版本根本不在同一个仓库。",
        },
        {
          title: "翻译和本地化对稿",
          body: "译稿应与原文对齐标题深度、列表长度和链接目标。Diff 不会给文笔打分，但能抓住步骤少了一步、表少了一列、链接还指着英文锚点。",
        },
        {
          title: "不能漏条款的制度稿",
          body: "隐私政策、条款、内部制度常常以 Markdown 起草，即使最终以 PDF 发布。并排对比，是确认某段是挪走了而不是消失了。两栏上的引用计数，则是文档由参考链接堆起来时的第二道检查。",
        },
      ],
    },
    {
      title: "怎样读 Markdown diff 才不容易迷路",
      body: [
        "从预览开始。大纲跳了，先修标题再争论措辞。然后切到原文，去看真正要紧的 hunk：变长变短的列表、表的一行、代码示例、URL。能忽略的纯空白变动就忽略；若一侧被自动格式化过，先把空白规范成一样，着色才会跟意义有关。",
        "整节显示为删除再插入，多半是搬了家。先确认内容还在，再看前后文，编号步骤有没有被搬断。行号的意义是你能说「对照侧第 84 行」，而不必把整段贴进聊天。",
      ],
    },
  ],
  jsonViewer: [
    {
      title: "JSON 本来没事，直到它变成一行，或者根本不是 JSON",
      body: [
        "API 返回压缩成一行的对象。配置文件嵌套到没人分得清哪对括号关上了哪个功能开关。语言模型吐出「几乎是 JSON」的东西：末尾逗号、注释、单引号字符串、值里面没转义的换行。日志流水线把整段载荷当成转义字符串倒出来。这些时候你要的往往不是新编辑器，而是一个能解析、能指出错误、能让你四处看看的地方。",
        "JSON 查看器故意留在浏览器里。生产 token、客户记录、预发环境密钥，出现在 JSON 里的频率比人们承认的更高。格式化这份载荷，不该要求你把它贴进可能记日志的随机网站。",
      ],
      items: [
        {
          title: "网络面板里读不动的 API 响应",
          body: "开发者工具可以美化，但不能让你删掉吵闹的键、压缩一个子集、存成夹具。把响应体贴过来，是在把线上响应变成测试用例，或把结构发给同事、却不想让截图里还带着授权头。",
        },
        {
          title: "配置、清单、基础设施文件",
          body: "package.json、appsettings、Terraform JSON、工作流载荷，规模不同，问题相同：嵌套的 map，你需要一次只展开一根枝。树形视图用来导航。格式化视图用来读即将提交的完整文件。",
        },
        {
          title: "工具调用和模型的结构化输出",
          body: "智能体用 JSON 传参。调用失败时，原因常常是该是字符串的类型、缺字段、或把一大段 Markdown 塞进了某个值。用树检查载荷，比在追踪界面里数括号更快。若模型把 JSON 包在字符串里，先去除转义，再看内层对象。",
        },
        {
          title: "文件「是 JSON」，却解析不了",
          body: "查看器会告诉你输入无效；若引擎知道位置，还会给出行列。在文档真正成为 JSON 之前，格式化和压缩保持禁用。这是故意的：美化非法输入，等于捏造一份并不存在的结构。",
        },
      ],
    },
    {
      title: "格式化、压缩、树形，是三份工作",
      body: [
        "格式化 JSON 用来读，也用来和其它已美化的文件做 diff。压缩 JSON 用来贴进环境变量、命令行参数、或对体积敏感的请求。树形用来探索：展开一个对象，折上其余的，删掉样例里不需要的键。悬停一行去掉属性，是把生产 dump 裁到缺陷单真正需要的字段的方式。",
        "太大的文档可能跳过树形，只留格式化视图。这是浏览器里跑的限制，不是让你把文件上传到别处的提示。完成后复制或下载；你在树里做的编辑，会同步回左边的源码。",
      ],
    },
  ],
  textReplacer: [
    {
      title: "你看见的 \\n，常常并不是换行",
      body: [
        "程序若想在字符串里表示换行，会写下反斜杠和字母 n。JSON 这样，很多日志这样，聊天导出、CSV 单元格、从浏览器复制的报错、代码生成的提示词也这样。落到剪贴板上的，是把「换一行」压缩成两个字形的转义：\\n。贴进笔记软件，你得到的是一段被压扁、符号还在的文字。文本没有坏，它只是还处于转义状态。",
        "制表符（\\t）、Windows 换行（\\r\\n）、以及日志把已经转义过的字符串再转义一次导致的双反斜杠，是同一类事。能解释这些序列的文本替换，是把文档找回来的方法：真正的换行、真正的列、能读的堆栈。反向任务同样存在——把可读草稿再编码回 JSON 字符串——因为流水线的下一环可能只接受转义形式。",
      ],
      items: [
        {
          title: "JSON 字段、接口样例、复制出来的载荷",
          body: "你取出的字段长得像 \"Hello\\nWorld\"，却希望屏幕上是两行。查找字面量 \\n，并在替换里解释转义，就是直接路径。从 JSON 查看器、Swagger UI、或把 body 引在一行里的日志中复制时，几乎总会碰到。",
        },
        {
          title: "以一行抵达的日志",
          body: "采集器和 SIEM 导出喜欢让一条事件待在一行里。消息内部的换行会被转义，文件才能保持一行一条。要读异常，就得把转义变回换行。放在浏览器里做，比把 dump 丢给会存文件的在线「格式化」工具更稳妥。",
        },
        {
          title: "聊天记录、CSV、表格",
          body: "Excel 和 Google 表格会把含换行的单元格显示成一个折行的格子，复制时有的给 \\n，有的给真正的换行，取决于软件。Slack、Teams、微信的备份也常把消息压平。过一遍替换，比手工清 400 行便宜。",
        },
        {
          title: "反过来：把换行编码进代码",
          body: "有时你已经写好可读的提示词或邮件，现在要放进 JSON、YAML 或单元测试字符串。把真正的换行变成 \\n（制表符变成 \\t），就是编码预设。不做这一步，贴回去的 JSON 往往直接解析失败。",
        },
      ],
    },
    {
      title: "替换，也是脏文本变成草稿的方法",
      body: [
        "不是每次都和转义有关。产品名会改。预发 URL 要变成生产 URL。模型写了三十次「某某公司」，法务要真实主体。一串方括号里的 ID，你想包成 Markdown 链接。带实时计数的查找替换，是人们仍会为此打开整个 IDE 的那件小事。",
      ],
      items: [
        {
          title: "提示词和模型输出的清理",
          body: "模型会吐出奇怪空距、重复标题、或夹在 Markdown 里的 HTML 实体。几次字面量替换——把引号拉直、去掉反复出现的签名、把三个空行收成一个——就能让草稿在进 MD 查看器之前变得可改。",
        },
        {
          title: "已经在剪贴板上的整篇改词",
          body: "「文档」已经在剪贴板里时，再开 Word 是多余的。粘贴，替换旧品牌名或旧 API 域名，看一眼替换次数，再复制回去。忽略大小写存在，是因为市场文案的大小写从来都不一致。",
        },
        {
          title: "当模式本身才是重点，用正则",
          body: [
            "字面量查找表达不了「每一串数字」或「最后一对引号里的文本」。JavaScript 正则可以。捕获组和替换里的 $1 / $2，是不写脚本也能包裹、重排、抽取的方法。贪婪是默认，因为 JS 就是这样；当 .* 吃得太多、你想要最短匹配时，关掉它。",
            "正则模式下，查找框里的 \\n 表示真正的换行，而不是反斜杠和 n 两个字符。若仍要找转义形式，请搜 \\\\n。「什么都没匹配到」，通常就是这一处搞反了。",
          ],
        },
      ],
    },
    {
      title: "相信输出之前，先核对选项",
      body: [
        "查找默认是字面量，除非你声明它是正则。替换默认原样插入，除非你要求解释转义。这两个开关彼此独立，所以能力强，也容易设错。右侧的实时结果才是事实——同时看次数和文本。次数是 0，说明查找串根本没出现。次数大得离谱，可能是开了正则、而模式在匹配空位置。",
      ],
      items: [
        {
          title: "字面量查找是更安全的默认",
          body: "字面量模式下，\\n 就是反斜杠加 n。JSON 风格的 dump 要的就是这个。只有当你确实希望 . * + ? 和字符类生效时，才打开正则。忘了关正则，IP 里的点就会开始匹配任意字符。",
        },
        {
          title: "只在需要的地方解释转义",
          body: "替换侧打开解释转义后，\\n 变成真正换行，\\t 变成制表符，\\r 变成回车，\\\\ 变成一个反斜杠。想让这些字符在结果里继续可见，就关掉它。",
        },
        {
          title: "贪婪与惰性，只是正则的问题",
          body: ".* 会吃到不能再吃为止。若你在包裹类 HTML 片段或引号字符串，替换却吞掉了半份文件，关掉贪婪（或自己写成 .*?）。字面量模式会忽略这个开关，因为根本没有量词。",
        },
      ],
    },
  ],
};

function patchLocale(fileName, bundle) {
  const filePath = path.join(root, "messages", fileName);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const [ns, seoSections] of Object.entries(bundle)) {
    if (!data[ns]) continue;
    data[ns].seoSections = seoSections;
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`updated ${fileName}`);
}

patchLocale("en.json", en);
patchLocale("zh.json", zh);
