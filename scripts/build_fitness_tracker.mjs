import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs/fitness_tracker");
const outputPath = path.join(outputDir, "12_week_fitness_progress_tracker.xlsx");

const workbook = Workbook.create();

const COLORS = {
  navy: "#17324D",
  blue: "#2F6F9F",
  green: "#2F855A",
  lightGreen: "#DDF4E7",
  yellow: "#FFF3CD",
  red: "#F8D7DA",
  gray: "#F3F4F6",
  darkGray: "#374151",
  white: "#FFFFFF",
  border: "#D1D5DB",
};

function addSheet(name) {
  return workbook.worksheets.add(name);
}

function setValues(sheet, range, values) {
  sheet.getRange(range).values = values;
}

function setFormulas(sheet, range, formulas) {
  sheet.getRange(range).formulas = formulas;
}

function styleHeader(range) {
  range.format.fill = COLORS.navy;
  range.format.font = { color: COLORS.white, bold: true };
  range.format.horizontalAlignment = "center";
  range.format.wrapText = true;
}

function styleSection(range) {
  range.format.fill = COLORS.blue;
  range.format.font = { color: COLORS.white, bold: true };
}

function styleTableHeader(range) {
  range.format.fill = COLORS.darkGray;
  range.format.font = { color: COLORS.white, bold: true };
  range.format.horizontalAlignment = "center";
  range.format.wrapText = true;
}

function applyGrid(range) {
  range.format.borders = { preset: "all", style: "thin", color: COLORS.border };
  range.format.wrapText = true;
}

function col(n) {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function setColumnWidths(sheet, widths) {
  for (const [letter, px] of Object.entries(widths)) {
    sheet.getRange(`${letter}1:${letter}120`).format.columnWidthPx = px;
  }
}

function addTitle(sheet, title, subtitle, lastCol = "H") {
  sheet.getRange(`A1:${lastCol}1`).merge();
  setValues(sheet, "A1:A2", [[title], [subtitle]]);
  styleHeader(sheet.getRange(`A1:${lastCol}1`));
  sheet.getRange("A1:A1").format.font.size = 16;
  sheet.getRange(`A2:${lastCol}2`).merge();
  sheet.getRange("A2:A2").format.fill = COLORS.gray;
  sheet.getRange("A2:A2").format.font = { color: COLORS.darkGray, italic: true };
  sheet.getRange("A2:A2").format.wrapText = true;
}

const settings = addSheet("Settings");
addTitle(settings, "12 周健身进度监测表 - Settings", "先改起始日期；其余规则用于 Dashboard 和日志自动汇总。", "F");
setValues(settings, "A4:B12", [
  ["Start Date", new Date(2026, 5, 8)],
  ["Planned Sessions / Week", 4],
  ["Lower/Core Target / Week", 2],
  ["Rehab Target / Week", 4],
  ["Green Pain Max", 2],
  ["Yellow Pain Max", 4],
  ["Red Pain Min", 5],
  ["A 档定义", "完整训练：主训练 + 核心/康复"],
  ["B 档定义", "最低有效训练：当天最重要的 1-2 个动作"],
]);
setValues(settings, "D4:E9", [
  ["C 档定义", "不断线训练：肩康复最低动作 + 一个低门槛动作"],
  ["下肢渐进规则", "连续 2 次达成目标次数且 RPE <= 8，再加 2.5-5%"],
  ["肩康复绿灯", "0-2/10 痛，次日无加重：维持或小幅增加"],
  ["肩康复黄灯", "3-4/10 痛或次日不适：降重量/次数/幅度 20-30%"],
  ["肩康复红灯", ">=5/10、刺痛、无力、夜间痛或持续加重：停止该动作并评估"],
  ["核心原则", "不断线 > 补进度；渐进 > 冲刺；每周只改一个变量"],
]);
applyGrid(settings.getRange("A4:E12"));
styleSection(settings.getRange("A4:A12"));
styleSection(settings.getRange("D4:D9"));
settings.getRange("B4:B4").format.numberFormat = "yyyy-mm-dd";
setColumnWidths(settings, { A: 170, B: 360, C: 24, D: 180, E: 460, F: 24 });

const plan = addSheet("Plan");
addTitle(plan, "12 周主线计划", "主线：下肢 + 核心稳定进步；并行限制：肩部康复，不让上肢训练拖垮系统。", "H");
setValues(plan, "A4:H4", [[
  "Week", "Start Date", "Phase", "Main Focus", "Lower/Core Target", "Shoulder Rehab Target", "Load Guidance", "Notes",
]]);
const phaseRows = [];
for (let week = 1; week <= 12; week++) {
  let phase;
  let focus;
  let guidance;
  if (week <= 3) {
    phase = "Build rhythm";
    focus = "找回节奏，动作稳定，全部保留余力";
    guidance = "RPE 6-8；不冲重量";
  } else if (week === 4) {
    phase = "Deload";
    focus = "降低 20-30% 总量，防受伤";
    guidance = "总量降 20-30%，保留动作";
  } else if (week <= 7) {
    phase = "Progress";
    focus = "小幅渐进，下肢核心推进";
    guidance = "连续 2 次达标再小幅加重";
  } else if (week === 8) {
    phase = "Deload + shoulder check";
    focus = "再降量，检查肩部反应";
    guidance = "肩痛黄灯则不加变量";
  } else if (week <= 11) {
    phase = "Progress";
    focus = "稳定推进，不冲 PR";
    guidance = "只加一个变量：重量/次数/幅度";
  } else {
    phase = "Review";
    focus = "总结数据，决定下一周期";
    guidance = "不冲刺，做周期复盘";
  }
  phaseRows.push([week, "", phase, focus, 2, 4, guidance, ""]);
}
setValues(plan, "A5:H16", phaseRows);
setFormulas(plan, "B5:B16", Array.from({ length: 12 }, (_, i) => [`=Settings!$B$4+(${i})*7`]));
styleTableHeader(plan.getRange("A4:H4"));
applyGrid(plan.getRange("A4:H16"));
plan.getRange("B5:B16").format.numberFormat = "yyyy-mm-dd";
setColumnWidths(plan, { A: 70, B: 115, C: 150, D: 310, E: 130, F: 150, G: 240, H: 260 });
plan.getRange("A5:A16").format.horizontalAlignment = "center";
plan.getRange("E5:F16").format.horizontalAlignment = "center";

const log = addSheet("Workout Log");
addTitle(log, "Workout Log", "只填白色输入列：Completion Tier、Y/N、疼痛、动作、负荷和备注。周统计会自动更新。", "Q");
const logHeaders = [
  "Week", "Planned Session", "Target Date", "Session Focus", "Planned Minimum",
  "Completion Tier", "Completed?", "Lower/Core Done?", "Shoulder Rehab Done?",
  "Pain During 0-10", "Pain Next Day 0-10", "Main Lower/Core Movement",
  "Load", "Sets x Reps", "RPE", "Notes", "Pain Flag",
];
setValues(log, "A4:Q4", [logHeaders]);
const sessionTemplates = [
  ["Day 1", 0, "Lower A + Core + Rehab minimum", "A/B/C"],
  ["Day 2", 1, "Shoulder Rehab + Safe Upper", "B/C"],
  ["Day 3", 3, "Lower B + Core + Rehab minimum", "A/B/C"],
  ["Day 4", 5, "Shoulder Rehab + Light Full Body/Cardio", "B/C"],
];
const logRows = [];
for (let week = 1; week <= 12; week++) {
  for (const tpl of sessionTemplates) {
    logRows.push([week, tpl[0], "", tpl[2], tpl[3], "", "", "", "", "", "", "", "", "", "", "", ""]);
  }
}
setValues(log, "A5:Q52", logRows);
const dateFormulas = [];
const completedFormulas = [];
const flagFormulas = [];
for (let r = 5; r <= 52; r++) {
  const sessionIndex = (r - 5) % 4;
  const offset = sessionTemplates[sessionIndex][1];
  dateFormulas.push([`=Settings!$B$4+(A${r}-1)*7+${offset}`]);
  completedFormulas.push([`=IF(OR(F${r}="A",F${r}="B",F${r}="C"),1,0)`]);
  flagFormulas.push([`=IF(OR(J${r}>=Settings!$B$10,K${r}>=Settings!$B$10),"RED",IF(OR(J${r}>Settings!$B$8,K${r}>Settings!$B$8),"YELLOW",IF(OR(J${r}<>"",K${r}<>""),"GREEN","")))`]);
}
setFormulas(log, "C5:C52", dateFormulas);
setFormulas(log, "G5:G52", completedFormulas);
setFormulas(log, "Q5:Q52", flagFormulas);
styleTableHeader(log.getRange("A4:Q4"));
applyGrid(log.getRange("A4:Q52"));
log.getRange("C5:C52").format.numberFormat = "yyyy-mm-dd";
log.getRange("A5:B52").format.horizontalAlignment = "center";
log.getRange("F5:K52").format.horizontalAlignment = "center";
log.getRange("Q5:Q52").format.horizontalAlignment = "center";
log.getRange("F5:F52").format.fill = COLORS.yellow;
log.getRange("H5:K52").format.fill = COLORS.yellow;
log.getRange("L5:P52").format.fill = COLORS.yellow;
log.getRange("Q5:Q52").conditionalFormats.add("containsText", { text: "GREEN", format: { fill: COLORS.lightGreen, font: { color: "#166534", bold: true } } });
log.getRange("Q5:Q52").conditionalFormats.add("containsText", { text: "YELLOW", format: { fill: COLORS.yellow, font: { color: "#92400E", bold: true } } });
log.getRange("Q5:Q52").conditionalFormats.add("containsText", { text: "RED", format: { fill: COLORS.red, font: { color: "#991B1B", bold: true } } });
setColumnWidths(log, {
  A: 58, B: 110, C: 115, D: 280, E: 105, F: 115, G: 92, H: 125, I: 135,
  J: 115, K: 125, L: 190, M: 90, N: 120, O: 70, P: 260, Q: 100,
});

const review = addSheet("Weekly Review");
addTitle(review, "Weekly Review", "每周看触达、下肢/核心、肩康复和疼痛信号；不要用它给自己打分。", "N");
const reviewHeaders = [
  "Week", "Start Date", "Planned", "Completed", "Completion Rate", "A Count", "B Count", "C Count",
  "Lower/Core Done", "Rehab Done", "Max Pain During", "Max Pain Next Day", "Status", "Next Week Adjustment",
];
setValues(review, "A4:N4", [reviewHeaders]);
const reviewRows = Array.from({ length: 12 }, (_, i) => [i + 1, "", "", "", "", "", "", "", "", "", "", "", "", ""]);
setValues(review, "A5:N16", reviewRows);
const reviewFormulas = [];
for (let r = 5; r <= 16; r++) {
  const weekCell = `A${r}`;
  reviewFormulas.push([
    `=INDEX(Plan!$B$5:$B$16,${weekCell})`,
    `=Settings!$B$5`,
    `=COUNTIFS('Workout Log'!$A:$A,${weekCell},'Workout Log'!$G:$G,1)`,
    `=IF(C${r}=0,"",D${r}/C${r})`,
    `=COUNTIFS('Workout Log'!$A:$A,${weekCell},'Workout Log'!$F:$F,"A")`,
    `=COUNTIFS('Workout Log'!$A:$A,${weekCell},'Workout Log'!$F:$F,"B")`,
    `=COUNTIFS('Workout Log'!$A:$A,${weekCell},'Workout Log'!$F:$F,"C")`,
    `=COUNTIFS('Workout Log'!$A:$A,${weekCell},'Workout Log'!$H:$H,"Y")`,
    `=COUNTIFS('Workout Log'!$A:$A,${weekCell},'Workout Log'!$I:$I,"Y")`,
    `=IFERROR(MAXIFS('Workout Log'!$J:$J,'Workout Log'!$A:$A,${weekCell}),"")`,
    `=IFERROR(MAXIFS('Workout Log'!$K:$K,'Workout Log'!$A:$A,${weekCell}),"")`,
    `=IF(OR(K${r}>=Settings!$B$10,L${r}>=Settings!$B$10),"RED: stop/assess",IF(OR(K${r}>Settings!$B$8,L${r}>Settings!$B$8),"YELLOW: reduce 20-30%",IF(E${r}>=0.75,"ON TRACK",IF(E${r}>=0.5,"MAINTAIN","RECOVERY MODE"))))`,
  ]);
}
setFormulas(review, "B5:M16", reviewFormulas);
styleTableHeader(review.getRange("A4:N4"));
applyGrid(review.getRange("A4:N16"));
review.getRange("B5:B16").format.numberFormat = "yyyy-mm-dd";
review.getRange("E5:E16").format.numberFormat = "0%";
review.getRange("A5:L16").format.horizontalAlignment = "center";
review.getRange("M5:M16").conditionalFormats.add("containsText", { text: "ON TRACK", format: { fill: COLORS.lightGreen, font: { color: "#166534", bold: true } } });
review.getRange("M5:M16").conditionalFormats.add("containsText", { text: "YELLOW", format: { fill: COLORS.yellow, font: { color: "#92400E", bold: true } } });
review.getRange("M5:M16").conditionalFormats.add("containsText", { text: "RED", format: { fill: COLORS.red, font: { color: "#991B1B", bold: true } } });
review.getRange("E5:E16").conditionalFormats.add("dataBar", { color: COLORS.green, gradient: true });
setColumnWidths(review, { A: 65, B: 115, C: 80, D: 92, E: 125, F: 80, G: 80, H: 80, I: 125, J: 105, K: 120, L: 125, M: 170, N: 260 });

const dashboard = addSheet("Dashboard");
addTitle(dashboard, "12 周健身 / 肩康复进度 Dashboard", "主线：下肢和核心稳步提高；肩部康复并行，不让伤病打断系统。", "H");
setValues(dashboard, "A4:B13", [
  ["Start Date", ""],
  ["Current Week", ""],
  ["Planned Sessions To Date", ""],
  ["Completed Sessions To Date", ""],
  ["Completion Rate To Date", ""],
  ["A / B / C Counts", ""],
  ["Lower/Core Sessions Done", ""],
  ["Rehab Sessions Done", ""],
  ["Current Week Status", ""],
  ["Next Review Question", "下周只改一个东西，改什么？"],
]);
setFormulas(dashboard, "B4:B12", [
  ["=Settings!$B$4"],
  ["=MIN(12,MAX(1,INT((TODAY()-Settings!$B$4)/7)+1))"],
  ["=SUMIF('Weekly Review'!$A$5:$A$16,\"<=\"&B5,'Weekly Review'!$C$5:$C$16)"],
  ["=SUMIF('Weekly Review'!$A$5:$A$16,\"<=\"&B5,'Weekly Review'!$D$5:$D$16)"],
  ["=IF(B6=0,\"\",B7/B6)"],
  ["=\"A \"&SUM('Weekly Review'!F5:F16)&\" / B \"&SUM('Weekly Review'!G5:G16)&\" / C \"&SUM('Weekly Review'!H5:H16)"],
  ["=SUM('Weekly Review'!I5:I16)"],
  ["=SUM('Weekly Review'!J5:J16)"],
  ["=INDEX('Weekly Review'!M5:M16,B5)"],
]);
styleSection(dashboard.getRange("A4:A13"));
applyGrid(dashboard.getRange("A4:B13"));
dashboard.getRange("B4:B4").format.numberFormat = "yyyy-mm-dd";
dashboard.getRange("B8:B8").format.numberFormat = "0%";
dashboard.getRange("B12:B12").conditionalFormats.add("containsText", { text: "ON TRACK", format: { fill: COLORS.lightGreen, font: { color: "#166534", bold: true } } });
dashboard.getRange("B12:B12").conditionalFormats.add("containsText", { text: "YELLOW", format: { fill: COLORS.yellow, font: { color: "#92400E", bold: true } } });
dashboard.getRange("B12:B12").conditionalFormats.add("containsText", { text: "RED", format: { fill: COLORS.red, font: { color: "#991B1B", bold: true } } });

setValues(dashboard, "D4:H4", [["Week", "Completion", "Lower/Core", "Rehab", "Status"]]);
setFormulas(dashboard, "D5:H16", Array.from({ length: 12 }, (_, i) => {
  const r = i + 5;
  return [
    `='Weekly Review'!A${r}`,
    `='Weekly Review'!E${r}`,
    `='Weekly Review'!I${r}`,
    `='Weekly Review'!J${r}`,
    `='Weekly Review'!M${r}`,
  ];
}));
styleTableHeader(dashboard.getRange("D4:H4"));
applyGrid(dashboard.getRange("D4:H16"));
dashboard.getRange("E5:E16").format.numberFormat = "0%";
dashboard.getRange("D5:G16").format.horizontalAlignment = "center";
dashboard.getRange("E5:E16").conditionalFormats.add("dataBar", { color: COLORS.green, gradient: true });
dashboard.getRange("H5:H16").conditionalFormats.add("containsText", { text: "ON TRACK", format: { fill: COLORS.lightGreen, font: { color: "#166534", bold: true } } });
dashboard.getRange("H5:H16").conditionalFormats.add("containsText", { text: "YELLOW", format: { fill: COLORS.yellow, font: { color: "#92400E", bold: true } } });
dashboard.getRange("H5:H16").conditionalFormats.add("containsText", { text: "RED", format: { fill: COLORS.red, font: { color: "#991B1B", bold: true } } });

setValues(dashboard, "A16:B24", [
  ["How to use", ""],
  ["1", "每次训练后只填 Workout Log 的黄色/白色输入列。"],
  ["2", "Completion Tier 只填 A/B/C 或留空；C 档也算不断线。"],
  ["3", "Lower/Core Done 和 Rehab Done 用 Y 标记。"],
  ["4", "疼痛按 0-10 填，红灯不要硬推。"],
  ["5", "每周只在 Weekly Review 的 Next Week Adjustment 写一个调整。"],
  ["6", "不要补进度；中断后从 C 或 B 档恢复。"],
  ["7", "第 4/8 周降量，第 12 周总结下一周期。"],
  ["", ""],
]);
dashboard.getRange("A16:B16").merge();
styleSection(dashboard.getRange("A16:B16"));
applyGrid(dashboard.getRange("A16:B24"));
setColumnWidths(dashboard, { A: 190, B: 260, C: 24, D: 70, E: 125, F: 105, G: 95, H: 190 });

await fs.mkdir(outputDir, { recursive: true });

for (const [sheetName, range] of [
  ["Dashboard", "A1:H24"],
  ["Workout Log", "A1:Q20"],
  ["Weekly Review", "A1:N16"],
  ["Plan", "A1:H16"],
  ["Settings", "A1:F12"],
]) {
  await workbook.render({ sheetName, range, scale: 1.25 });
}

const dashboardCheck = await workbook.inspect({
  kind: "table",
  range: "Dashboard!A1:H24",
  include: "values,formulas",
  tableMaxRows: 24,
  tableMaxCols: 8,
});
console.log(dashboardCheck.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`SAVED ${outputPath}`);
