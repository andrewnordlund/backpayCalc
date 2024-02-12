/*
 *	To-do:
 *		* Fix anniversary problem								- Fixed
 *		* Deal with anniversary dates == contract dates						- Done
 *		* OT not showing up in the right pay period						- Fixed.
 *		* Make sure promotions, actings, overtimes, lwops, and lump sums use querySelectorAll	- Done....I think
 *		* Contractual increases not taking place during acting periods				- Done
 *		* Anniversaries not being honoured during actings/lwops.				- Done
 *		* Start after beginning of contract
 *		* Being on acting at beginning of contract
 *		* Being on lwop at beginning of contract
 *
 */

var dbug = false;
var version = "3.3.0";
var lang = "en";
var langFormat = "en-CA";
var updateHash = true;
var saveValues = null;
var showExtraCols = true;
var level = -1;
var step = -1;
var mainForm = null;
var startingSalary = 0;
var resultsDiv = null;
var startDateTxt = null;
var levelSel = null;
var stepSelect = null;
var numPromotions = null;
var addPromotionBtn = null;
var addActingBtn = null;
var addOvertimeBtn = null;
var addLwopBtn = null;
var addLumpSumBtn = null;
var resultStatus = null;
var calcStartDate = null;
var endDateTxt = "2021-04-15";
var TABegin = new Date("2021", "11", "22");		// Remember months:  0 == Janaury, 1 == Feb, etc.
var DefEndDate = new Date("2024", "01", "14");		// This is the day after this should stop calculating; same as endDateTxt.value in the HTML
var EndDate = new Date(DefEndDate.getTime());		// This is the day after this should stop calculating; same as endDateTxt.value in the HTML
var day = (1000 * 60 * 60 * 24);
var parts = [];
var resultsBody = null;
var resultsFoot = null;
var resultsTheadTR = null;
var periods = [];
var initPeriods = [];
var lumpSumPeriods = {};
var overtimePeriods = {};
var promotions = 0;
var actings = 0;
var lumpSums = 0;
var overtimes = 0;
var lwops = 0;
var lastModified = new Date("2024", "01", "12");		// Remember months:  0 == Janaury, 1 == Feb, etc.
var lastModTime = null;
var salaries = [];
let weekly = [];
var daily = [];
var hourly = [];
var newRates = {};
var i18n = {};
var levels = 0;
var classification = "IT";
var CAName = "2021-2025";
let payload = {};
	
const wiy = 52.176;

// taken from http://www.tbs-sct.gc.ca/agreements-conventions/view-visualiser-eng.aspx?id=1#toc377133772
/*
var salaries = [
	[56907, 59011, 61111, 63200, 65288, 67375, 69461, 73333],
	[70439, 72694, 74947, 77199, 79455, 81706, 83960, 86213],
	[83147, 86010, 88874, 91740, 94602, 97462, 100325, 103304],
	[95201, 98485, 101766, 105050, 108331, 111613, 114896, 118499],
	[108528, 112574, 116618, 120665, 124712, 128759, 132807, 136852, 141426]

];
var daily = [
	[218.13, 226.20, 234.25, 242.26, 250.26, 258.26, 266.26, 281.10],
	[270.01, 278.65, 287.29, 295.92, 304.57, 313.19, 321.83, 330.47],
	[318.72, 329.69, 340.67, 351.66, 362.63, 373.59, 384.56, 395.98],
	[364.92, 377.51, 390.09, 402.68, 415.25, 427.83, 440.42, 454.23],
	[416.01, 431.52, 447.02, 462.53, 478.04, 493.56, 509.07, 524.58, 542.11]
];
var hourly = [
	[29.08, 30.16, 31.23, 32.30, 33.37, 34.43, 35.50, 37.48],
	[36.00, 37.15, 38.30, 39.46, 40.61, 41.76, 42.91, 44.06],
	[42.50, 43.96, 45.42, 46.89, 48.35, 49.81, 51.28, 52.80],
	[48.66, 50.33, 52.01, 53.69, 55.37, 57.04, 58.72, 60.56],
	[55.47, 57.54, 59.60, 61.67, 63.74, 65.81, 67.88, 69.94, 72.28]
];
*/
//var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
//var days = [31, 29, 31
function init () {
	if (dbug) console.log ("Initting");
	lang = document.documentElement.lang;
	if (lang == "fr") langFormat = "fr-CA";
	//saveValues = new Map();
	var calcBtn = document.getElementById("calcBtn");
	levelSel = document.getElementById("levelSelect");
	//if (updateHash) levelSel.addEventListener("change", saveValue, false);
	stepSelect = document.getElementById("stepSelect");
	//if (updateHash) stepSelect.addEventListener("change", saveValue, false);
	mainForm = document.getElementById("mainForm");
	resultsDiv = document.getElementById("resultsDiv");
	startDateTxt = document.getElementById("startDateTxt");
	//if (updateHash) startDateTxt.addEventListener("change", saveValue, false);
	endDateTxt = document.getElementById("endDateTxt");
	//if (updateHash) startDateTxt.addEventListener("change", saveValue, false);
	calcStartDate = document.getElementById("calcStartDate");
	addPromotionBtn = document.getElementById("addPromotionBtn");
	addActingBtn = document.getElementById("addActingBtn");
	addOvertimeBtn = document.getElementById("addOvertimeBtn");
	addLwopBtn = document.getElementById("addLwopBtn");
	addLumpSumBtn = document.getElementById("addLumpSumBtn");
	resultsBody = document.getElementById("resultsBody");
	resultsFoot = document.getElementById("resultsFoot");
	resultsTheadTR = document.getElementById("resultsTheadTR");
	resultStatus = document.getElementById("resultStatus");
	lastModTime = document.getElementById("lastModTime");

	let langSwitchA = null;
	langSwitchA = document.getElementById("langSwitchA");
	if (langSwitchA) {
		if (dbug) console.log ("init::lang link thingy: lang: " + lang + "; href: " + window.location.href + ".");
		langSwitchA.href = (lang == "en" ? window.location.href.replace("backpayCalc.html", "arrDeSalCalc.html") : window.location.href.replace("arrDeSalCalc.html", "backpayCalc.html"));
	}
	
	// These next two lines, down the road, should allow for other bargaining groups and CAs to be added.
	classification = getClassification();
	CAName = getCAName();

	getData(classification, CAName);

	genRates ();
	genTables ();

	if (lastModTime) {
		lastModTime.setAttribute("datetime", lastModified.toISOString().substr(0,10));
		lastModTime.innerHTML = lastModified.toLocaleString(lang + "-CA", { year: 'numeric', month: 'long', day: 'numeric' });	
	}
	if (dbug || showExtraCols) {
		var ths = resultsTheadTR.getElementsByTagName("th");
		if (ths.length == 4) {
			createHTMLElement("th", {"parentNode":resultsTheadTR, "scope":"col", "textNode":getStr("level")});
			createHTMLElement("th", {"parentNode":resultsTheadTR, "scope":"col", "textNode":getStr("step")});
			createHTMLElement("th", {"parentNode":resultsTheadTR, "scope":"col", "textNode":getStr("there")});
			createHTMLElement("th", {"parentNode":resultsTheadTR, "scope":"col", "textNode":getStr("salary")});
			createHTMLElement("th", {"parentNode":resultsTheadTR, "scope":"col", "textNode":getStr("workingDays")});
		}
	}
	/*for (var r in results) {
		results[r] = document.getElementById(r);
	}*/
	if (dbug) console.log("init::MainForm is " + mainForm + ".");
	if (levelSel && stepSelect && mainForm && startDateTxt && calcBtn && addActingBtn && addPromotionBtn) {
		if (dbug) console.log ("Adding change event to calcBtn.");
		levelSel.addEventListener("change", populateSalary, false);
		if (levelSel.value.match(/[1-5]/)) populateSalary();
		startDateTxt.addEventListener("change", selectSalary, false);
		if (startDateTxt.value.replace(/[^-\d]/, "").match(/YYYY-MM-DD/)) populateSalary();
	
		calcBtn.addEventListener("click", startProcess, false);
		addActingBtn.addEventListener("click", addActingHandler, false);
		addLwopBtn.addEventListener("click", addLWoPHandler, false);
		addOvertimeBtn.addEventListener("click", addOvertimeHandler, false);
		addLumpSumBtn.addEventListener("click", addLumpSumHandler, false);
		addPromotionBtn.addEventListener("click", addPromotionHandler, false);
	} else {
		if (dbug) console.error ("Couldn't get levelSelect.");
	}
	handleHash ();
} // End of init

function getClassification () {
	return classification;
} // End of getClassification

function getCAName() {
	return CAName;
} // End of getCAName


// Check the document location for saved things
function handleHash () {
	let hasHash = false;
	let thisURL = new URL(document.location);
	let params = thisURL.searchParams;

	//let hash = thisURL.hash;
	let toCalculate = 0;
	if (params.has("dbug")) {
		if (params.get("dbug") == "true") dbug= true;
	}

	if (params.has("lvl")) {
		let lvl = params.get("lvl").replace(/\D/g, "");
		levelSel.selectedIndex = lvl;
		toCalculate = toCalculate + 1;
		populateSalary();
		hasHash = true;
	}
	if (params.has("strtdt")) {
		let sd = params.get("strtdt");
		if (sd.match(/\d\d\d\d-\d\d-\d\d/)) {
			startDateTxt.value = sd;
			toCalculate = toCalculate | 2;
		}
		hasHash = true;
	}
	if (params.has("stp")) {
		let stp = params.get("stp").replace(/\D/g, "");
		stepSelect.selectedIndex = (parseInt(stp) + parseInt(1));
		toCalculate = toCalculate | 4;
		hasHash = true;
	}
	/*
	setTimeout (function () {
		console.log ("Gonna try and set step now");
		if (params.get("stp")) {
			let stp = params.get("stp").replace(/\D/g, "");
			console.log ("And gonna set it now to " + stp + ".");
			stepSelect.selectedIndex = stp;
			toCalculate = toCalculate | 4;
		}}, 0);
	*/
	if (params.get("enddt")) {
		let ed = params.get("enddt");
		if (ed.match(/\d\d\d\d-\d\d-\d\d/)) {
			endDateTxt.value = ed;
			toCalculate = toCalculate | 8;
		}
		hasHash = true;
	}
	
	// Promotions
	let looking = true;
	for (i = 0; i<5 && looking; i++) {
		if (params.has("pdate" + i) && params.has("plvl"+i)) {
			addPromotionHandler(null, {"date" : params.get("pdate" + i), "level" : params.get("plvl" + i), "toFocus" : false});
			hasHash = true;
		} else {
			looking = false;
		}
	}

	// Actings
	looking = true;
	let acl = 0;
	//dbug = true;
	while (looking) {
		// afrom0=2020-01-05&ato0=2020-02-06&alvl0=3&afrom1=2020-04-04&ato1=2020-05-06&alvl1=3
		if (params.has("afrom" + acl) || params.has("ato"+acl) || params.has("alvl"+acl)) {
			if (params.has("afrom" + acl) && params.has("ato"+acl) && params.has("alvl"+acl)) {
				addActingHandler(null, {"from" : params.get("afrom" + acl), "to" : params.get("ato" + acl), "level" : params.get("alvl" + acl), "toFocus" : false});
				hasHash = true;
			}
		} else {
			looking = false;
		}
		acl++;
	}
	//dbug = false;

	// LWoPs
	looking = true;
	let ls = 0;
	while (looking) {
		if (params.has("lfrom" + ls) || params.has("lto"+ls)) {
			if (params.has("lfrom" + ls) && params.has("lto"+ls)) {
				addLWoPHandler(null, {"from" : params.get("lfrom" + ls), "to" : params.get("lto" + ls), "toFocus" : false});
				hasHash = true;
			}
		} else {
			looking = false;
		}
		ls++;
	}

	// Overtimes/Standbys
	looking = true;
	let ots = 0;
	while (looking) {
		if (params.has("otdate" + ots) || params.has("otamt"+ots) || params.has("otrt"+ots)) {
			if (params.has("otdate" + ots) && params.has("otamt"+ots) && params.has("otrt"+ots)) {
				addOvertimeHandler(null, {"date" : params.get("otdate" + ots), "hours" : params.get("otamt" + ots), "rate" : params.get("otrt" + ots), "toFocus" : false});
				hasHash = true;
			}
		} else {
			looking = false;
		}
		ots++;
	}

	// Lump Sum Payments
	looking = true;
	let lss = 0;
	while (looking) {
		if (params.has("lsdate" + lss) || params.has("lsamt"+lss) || params.has("lsrt"+lss)) {
			if (params.has("lsdate" + lss) && params.has("lsamt"+lss)) {
				addLumpSumHandler(null, {"date" : params.get("lsdate" + lss), "hours" : params.get("lsamt" + lss), "toFocus" : false});
				hasHash = true;
			}
		} else {
			looking = false;
		}
		lss++;
	}

	if (dbug) console.log ("toCalculate: " + toCalculate + ": " + toCalculate.toString(2) + ".");
	if (hasHash) {
		//calcBtn.focus();
		let clickEv = new Event("click");
		calcBtn.dispatchEvent(clickEv);

	}


} // End of handleHash

function saveValue (e) {
	let ot = e.originalTarget;
	let key = ot.id;
	let value = (ot.toString().match(/HTMLSelect/) ? ot.selectedIndex : ot.value);
	//saveValues[key] = value;
	//saveValues.set(key, value);

	

	if (updateHash) setURL();
} // End of saveValue

// set the URL
function setURL () {
	//console.log ("Setting hash.");
	let url = new URL(document.location);
	let newURL = url.toString().replace(/#.*$/, "");
	newURL = newURL.replace(/\?.*$/, "");
	//let params = [];
	/*for (let id in filters) {
		if (!filters[id].checked) {
			params.push(id.replace("Chk", ""));
			if (id.match(/levelA/)) {
				params[params.length-1] += "$";
			}
		}
	}*/
	/*
	if (levelSel) saveValues["lvl"] = levelSel.selectedIndex);
	if (startDateTxt.value) ("strtdt=" +  startDateTxt.value);
	if (stepSelect) params.push("stp=" +  stepSelect.selectedIndex);
	if (endDateTxt.value) params.push("enddt=" +  endDateTxt.value);

	newURL += "?" + params.join("&");
	*/
	newURL += "?";
	/*saveValues.forEach(function (val, key, saveValues) {
		console.log ("adding " + key + "=" + val);
		newURL += key + "=" + val + "&";
		});
	newURL = newURL.substring(0, newURL.length - 1);
	*/
	newURL += saveValues.join("&");
	/*
	if (params.length > 0) {
		newURL += "?filters=" + params.join(sep) + (selectedTab != "" ? "&" + selectedTab : "") + url.hash;
	} else {
		newURL += (selectedTab != "" ? "?" + selectedTab : "") + url.hash;
	}
	*/
	history.pushState({}, document.title, newURL);
	

} // End of setURL




/*
   Populates the Salary Select basedon the IT-0x level selected
*/
function populateSalary () {
	removeChildren(stepSelect);
	if (levelSel.value >0 && levelSel.value <= levels) {
		createHTMLElement("option", {"parentNode":stepSelect, "value":"-1", "textNode":getStr("selectSalaryLbl")});
		for (var i = 0; i < salaries[(levelSel.value-1)].length; i++) {
			createHTMLElement("option", {"parentNode":stepSelect, "value":i, "textNode": getStr("step") + " " + (+i+1) + " - " + formatter.format(salaries[levelSel.value-1][i])});
		}
	}
	if (startDateTxt.value.replace(/[^-\d]/, "").match(/(\d\d\d\d)-(\d\d)-(\d\d)/)) selectSalary();
} // End of populateSalary

// Once an IT-level and startDate have been selected, select the most likely salary from the dropdown
// Called from init when startDateTxt has changed, and from populateSalary if startDateTxt is a date (####-##-##)

// I don't get it.  What's the difference btween selectSalary and getSalary?
// They both start the same way: get the startDateText date, check for leapyear, set the startDateTxt value, figure out your step, select the step
// Answer:  selectSalary is triggered on the change of startDateTxt.  getSalary is part of startProcess.
function selectSalary () {
	//if (!(levelSelect.value > 0 && levelSelect.value <= 5))
	if (parts && levelSel.value >0 && levelSel.value <= 5) {	// if you have a start date, and an IT-0x level
		let startDate = getStartDate();
		startDateTxt.value = startDate.toISOString().substr(0,10)
		let timeDiff = (TABegin - startDate) / day;
		let years = Math.floor(timeDiff/365);

		if (dbug) console.log ("TimeDiff between " + TABegin.toString() + " and " + startDate.toString() + ": "  + timeDiff + ".");

		if (timeDiff < 0) {
			// You started before the CA started
			calcStartDate.setAttribute("datetime", startDate.toISOString().substr(0,10));
			calcStartDate.innerHTML = startDate.toLocaleString("en-CA", { year: 'numeric', month: 'long', day: 'numeric' });

			step = 1;
		} else {
			// You started after the CA started
			calcStartDate.setAttribute("datetime", TABegin.toISOString().substr(0,10));
			calcStartDate.innerHTML = TABegin.toLocaleString("en-CA", { year: 'numeric', month: 'long', day: 'numeric' });

			var step = Math.ceil(years, salaries[levelSel.value].length-1) + 1;
		}
		if (dbug) console.log ("Your step would be " + step + ".");
		if (step > salaries[levelSel.value].length) step = salaries[levelSel.value].length;
		if (dbug) console.log ("But there ain't that many steps.  so you're step " + step +".");

		stepSelect.selectedIndex=step;
		//step = Math.min(years, salaries[levelSel.value].length);

		/*
		var opts = stepSelect.getElementsByTagName("option");
		for (var i = 0; i < opts.length; i++) {
			if (opts[i].hasAttribute("selected")) opts[i].removeAttribute("selected");
			if (i == step) opts[i].setAttribute("selected", "selected");
		}
		*/

	}
} // End of selectSalary

function getStartDate () {
	let dparts = null;
	startDateTxt.value = startDateTxt.value.replace(/[^-\d]/, "");
	dparts = startDateTxt.value.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
	if (dbug) console.log ("Got startDateTxt " + startDateTxt.value + ".");
	if (dbug) console.log ("Got dparts " + dparts + ".");
	if (dparts) {
		// Leap years
		if (dparts[2] == "02" && dparts[3] > "28") {
			if (parseInt(dparts[1]) % 4 === 0 && dparts[3] == "29") {
				// Do nothing right now
			} else {
				dparts[3]=(parseInt(dparts[1]) % 4 === 0? "29" : "28");
			}
		}
		return new Date(dparts[1], dparts[2]-1, dparts[3]);
	} else {
		// Add an error
		//addErrorMessage(startDateTxt.id, getStr("startDateErrorMsg"));
		return false;
	}

} // End of getStartDate

function startProcess () {
	resetPeriods();
	saveValues = [];
	lumpSumPeriods = {};
	overtimePeriods = {};
	if (resultsBody) {
		removeChildren (resultsBody);
	} else {
		var resultsTable = document.getElementById("resultsTable");
		resultsBody = createHTMLElement("tbody", {"parentNode":resultsTable, "id":"resultsBody"});
	}
	if (resultsFoot) {
		removeChildren (resultsFoot);
	} else {
		var resultsTable = document.getElementById("resultsTable");
		resultsFoot = createHTMLElement("tfoot", {"parentNode":resultsTable, "id":"resultsFoot"});
	}

	// Remove any existing error messages
	let errorDivs = document.querySelectorAll(".error");
	if (dbug && errorDivs.length > 0) console.log ("Found " + errorDivs.length + " errorDivs.");
	for (var i = 0; i < errorDivs.length; i++) {
		if (errorDivs[i].hasAttribute("id")) {
			var id = errorDivs[i].getAttribute("id");
			var referrers = document.querySelectorAll("[aria-describedby="+id+"]");
			for (var j = 0; j<referrers.length; j++) {
				if (referrers[j].getAttribute("aria-describedby") == id) {
					referrers[j].removeAttribute("aria-describedby");
				} else {
					referrers[j].setAttribute("aria-describedby", referrers[j].getAttribute("aria-describedby").replace(id, "").replace(/\s+/, " "));
				}
			}
		}
		errorDivs[i].parentNode.removeChild(errorDivs[i]);
	}

	initErrorHandling();

	// get salary?
	//dbug = true;
	getSalary();

	// Add promotions
	addPromotions();
	//dbug = false;
	// Add actings
	getActings ();

	// Add lwops
	getLWoPs ();

	// Add Overtimes
	getOvertimes();
	// Add Lump Sums
	getLumpSums ();

	errorDivs = document.querySelectorAll(".error");

	if (errorDivs.length == 0 ) {
		if (updateHash) setURL();
		calculate();
	} else {
		let firstErrorMessageID = errorDivs[0].id;
		console.log ("First error Message ID: " + firstErrorMessageID + ".");
		let selector = "*[aria-describedby~=" + firstErrorMessageID + "]";
		console.log ("Using selector "+ selector + ".");
		let firstErrInput = document.querySelector(selector);
		console.log ("Got first error input: "  + firstErrInput.id + ".");
		if (firstErrInput) firstErrInput.focus();
	}

} // End of startProcess

function resetPeriods () {
	if (dbug) {
		//console.log ("resetPeriods::initPeriods: " + initPeriods + ".");
		let initMsg = [];
		let oldMsg = [];
		for (let i = 0; i < initPeriods.length; i++) {
			initMsg.push(initPeriods[i]["reason"]);
		}
		console.log ("initMsg: " + initMsg.join(",") + ".");
		//console.log ("resetPeriods::periods: " + periods + ".");
		for (let i = 0; i < periods.length; i++) {
			oldMsg.push(periods[i]["reason"]);
		}
		console.log ("oldMsg: " + oldMsg.join(",") + ".");
	}
	periods = [];
	try {
		periods = structuredClone(initPeriods);
	}
	catch (ex) {
		console.error ("Didn't do structuredClone. Gonna try sringigy->parse");
		periods = JSON.parse(JSON.stringify(initPeriods));
	}

	// newRates = {};		Sound I reset newRates here?

	if (dbug) {
		//console.log ("resetPeriods::initPeriods: " + initPeriods + ".");
		let initMsg = [];
		let oldMsg = [];
		for (let i = 0; i < initPeriods.length; i++) {
			initMsg.push(initPeriods[i]["reason"]);
		}
		console.log ("initMsg: " + initMsg.join(",") + ".");
		//console.log ("resetPeriods::periods: " + periods + ".");
		for (let i = 0; i < periods.length; i++) {
			oldMsg.push(periods[i]["reason"]);
		}
		console.log ("oldMsg: " + oldMsg.join(",") + ".");
	}
} // End of resetPeriods


// Check the initial inputs for errors.  Check the promtions, actings, etc. later.
function initErrorHandling () {
	// Check Level
	let levelSelect = document.getElementById("levelSelect");
	let lvl = levelSelect.value.replace(/\D/, "");
	if (dbug) console.log ("Got level " + lvl + "."); // and start date of " + startDate + ".");

	// Check Start Date

	// Check Step/Salary

	// Check End Date


} // End of initErrorHandling

// getSalary called during startProcess.  "guess" isn't really a good word for this, so I changed it to "get"

// I don't get it.  What's the difference btween selectSalary and getSalary?
// This ones starts: get the IT-0level, get the startDateTxt date, check for leapyear, set the startDateTxt value, figure out your step, select the step
// Answer:  selectSalary is triggered on the change of startDateTxt.  getSalary is part of startProcess.
function getSalary () {

	// Check Level
	var levelSelect = document.getElementById("levelSelect");
	var lvl = levelSelect.value.replace(/\D/, "");
	if (dbug) console.log ("Got level " + lvl + "."); // and start date of " + startDate + ".");
	if (lvl < 1 || lvl > levels) {	// Should only happen if someone messes with the querystring
		if (dbug) console.log ("getSalary::Error:  lvl is -1.");
		addErrorMessage(levelSelect.id, getStr("levelSelectError"));
		//let errDiv = createHTMLElement("div", {"parentNode":levelSelect.parentNode, "id":"levelSelectError", "class":"error"});
		//createHTMLElement("span", {"parentNode":errDiv, "nodeText":getStr("levelSelectError")});
		//levelSelect.setAttribute("aria-describedby", "levelSelectError");
		//levelSelect.focus();
		//return;
	} else {
		saveValues.push("lvl="+lvl);
	}
	level = ((lvl > 0 && lvl < salaries.length+1) ? lvl : null);

	// Check Start Date
	let startDate = getStartDate();

	// Check if Salary/Step is populated.  this is likely a Level error
	if (stepSelect.options.length == 0 || stepSelect.value == "-1") {
		// Somehow the stepSelect never got populated. This is most likely because a Level was never selected, Javascript is turned off, or there was a Javascript error.
		if (dbug) console.log ("getSalary::Error:  stepSelect.option.length is " + stepSelect.options.length + ".");
		addErrorMessage(stepSelect.id, getStr("stepSelectEmptyError"));
		//let errDiv = createHTMLElement("div", {"parentNode":stepSelect.parentNode, "id":"stepSelectError", "class":"error"});
		//createHTMLElement("span", {"parentNode":errDiv, "nodeText":getStr("stepSelectEmptyError")});
		//stepSelect.setAttribute("aria-describedby", "stepSelectError");
		//stepSelect.focus();
	}
	

	// Check End Date
	let dparts = null;
	dparts = endDateTxt.value.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
	let endDateGood = true;
	if (dparts) {
		EndDate = new Date(dparts[1], (dparts[2]-1), dparts[3]);
		EndDate.setDate(EndDate.getDate() + parseInt(1));
		if (startDate - EndDate >= 0) {
			//EndDate = new Date(DefEndDate.getTime());
			// Add error message about how End Date must be after Start Date
			if (dbug) console.log ("getSalary::Error:  EndDate is " + EndDate.toISOString().substr(0,10) + " which is <= " + startDate.toISOString().substr(0,10) + ".");
			addErrorMessage(endDateTxt.id, getStr("endDateTxtError"));
			endDateGood = false;
			//let errDiv = createHTMLElement("div", {"parentNode":endDateTxt.parentNode, "id":"endDateTxtError", "class":"error"});
			//createHTMLElement("span", {"parentNode":errDiv, "nodeText":getStr("endDateTxtEmptyError")});
			//endDateTxt.setAttribute("aria-describedby", endDateTxt.getAttribute("aria-describedby") + " endDateTxtError");
		}
		if (dbug) console.log ("getSalary::Got EndDateTxt as " + endDateTxt.value + ".");
		//if (dbug) console.log ("Got EndDate as " + EndDate.toISOString().substr(0, 10) + ".");
	} else {
		// Prolly should check
		//EndDate = new Date(DefEndDate.getTime());
		//let endDateStr = EndDate.toISOString().substr(0, 10);
		//if (dbug) console.log ("getSalary::Setting EndDateTxt as " + endDateStr + ".");
		//endDateTxt.value = endDateStr;
		addErrorMessage(endDateTxt.id, getStr("endDateTxtError"));
		endDateGood = false;
	}
	//This used to be below adding anniversaries, but some anniversaries were being missed
	if (endDateGood) {
		if (dbug) console.log ("getSalary::About to set EndDate to " + EndDate.toISOString().substr(0, 10) + ".");
		addPeriod ({"startDate" : EndDate.toISOString().substr(0, 10), "increase":0, "reason":"end", "multiplier" : 1});
	}

	if (level && startDate) {
		
		level -= 1;

		if (dbug) console.log("getSalary::Got valid data (" + startDate.toISOString().substr(0,10) + ")....now trying to figure out salary.");
			
		let timeDiff = (TABegin - startDate) / day;

		
		if (stepSelect.value && stepSelect.value >= 0 && stepSelect.value < salaries[level].length) {
			step = stepSelect.value;
			if (dbug) console.log ("getSalary::Got step from the stepSelect.  And it's " + step + ".");
		} else {
			if (dbug) console.log ("getSalary::Couldn't get step from the stepSelect. Gotta guess. stepSelect.value: " + stepSelect.value + ".");
			if (dbug) console.log ("getSalary::TimeDiff: "  + timeDiff + ".");
			
			let years = Math.floor(timeDiff/365);
			step = Math.min(years, salaries[level].length-1);
			if (dbug) console.log ("getSalary::Your step would be " + step + ".");
		}
		var stp = step;

		saveValues.push("stp="+stp);
		saveValues.push("strtdt="+startDateTxt.value);
		saveValues.push("enddt="+endDateTxt.value);

		//add anniversarys
		//dbug = true;
		let startYear = Math.max(2021, startDate.getFullYear());
		if (dbug) console.log ("getSalary::Going to set anniversary dates betwixt: " + startYear + " and " + EndDate.getFullYear() + ".");
		for (let i = startYear; i <=EndDate.getFullYear(); i++) {
			if (stp < salaries[level].length) {
				let dateToAdd = i + "-" + ((startDate.getMonth()+1) > 9 ? "" : "0") + (startDate.getMonth()+1)	+ "-" + (startDate.getDate() > 9 ? "" : "0") +  startDate.getDate();
				if (dbug) console.log ("getSalary::Going to set anniversary date " + dateToAdd + ".");
				if (dateToAdd > startDate.toISOString().substr(0,10)) {
					if (dbug) console.log ("getSalary::Going to add anniversary on " + dateToAdd + " because it's past " + startDate.toISOString().substr(0,10) + ".");
					addPeriod ({"startDate": dateToAdd, "increase":0, "reason":"Anniversary Increase", "multiplier":1});
					stp++;
				} else {
					if (dbug) console.log ("getSalary::Not going to add anniversary on " + dateToAdd + " because it's too early.");
				}
			}
		}
		//dbug = false;
		if (timeDiff < 0) {
			if (dbug) console.log ("getSalary::You weren't even there then.");
			// remove all older periods?? Maybe?  Or just somehow make them 0s?
			// This one makes the mulitpliers 0.
			addPeriod ({"startDate" : startDate.toISOString().substr(0,10), "increase":0, "reason":"Starting", "multiplier":1});
			for (let i = 0; i < periods.length; i++) {
				if (startDate.toISOString().substr(0,10) > periods[i]["startDate"]) periods[i]["multiplier"] = 0;
			}
			
			// This one removes the ones before start date.
			// This _sounds_ good, but it totally messes up the compounding raises later.
			/*
			addPeriod ({"startDate" : startDate.toISOString().substr(0,10), "increase":0, "reason":"Starting", "multiplier":1});
			do {
				periods.shift();
			} while (periods[0]["startDate"] <= startDate.toISOString().substr(0,10) && periods[0]["reason"] != "Starting");
			*/
			//for (var i = periods.length-1; i >=0; i--)
			/*
			if (dbug) console.log ("getSalary::From step " + step + ".");
			step = step - startYear - EndDate.getFullYear();
			if (dbug) console.log ("getSalary::to step " + step + ".");
			*/
		} else {
			//var salary = salaries[level][step];
			//if (dbug) console.log ("You were there at that point, and your salary would be $" + salary.toFixed(2) + ".");
		}
		if (dbug) {
			console.log("getSalary::pre-calc checks:");
			for (let i = 0; i < periods.length; i++) {
				console.log ("getSalary::" + periods[i]["reason"] + ": " + periods[i]["startDate"] + ".");
			}
		}

	} else {
		if (dbug) console.log ("getSalary::Something's not valid.  Lvl: " + level + ", startDate: " + startDate + ".");
		addErrorMessage("startDateTxt", getStr("startDateErrorMsg"));
	}

} // End of getSalary

function addPromotions () {
	// Add promotions
	var promotions = document.querySelectorAll(".promotions");
	var numOfPromotions = promotions.length;
	if (dbug) console.log("addPromotions::Checking for " + numOfPromotions + " promotions.");
	let startDate = calcStartDate.getAttribute("datetime");
	for (var i = 0; i < promotions.length; i++) {
		let promoLevelSel = promotions[i].getElementsByTagName("select")[0]; //.value;
		let promoLevel = promoLevelSel.value;
		if (dbug) console.log("addPromotions::promoLevel " + i + ": " + promoLevel + ".");
		let promoDateIn  = promotions[i].getElementsByTagName("input")[0]; 
		let promoDate = promoDateIn.value.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
		if (dbug) console.log("addPromotions::promoDate " + i + ": " + promoDate[0] + ".");
		if (promoDate) {
			if (promoDate[0] > startDate && promoDate[0] < EndDate.toISOString().substr(0, 10) && promoLevel > 0 && promoLevel <=levels) {
			//if (promoDate[0] > TABegin.toISOString().substr(0,10) && promoDate[0] < EndDate.toISOString().substr(0, 10) && promoLevel > 0 && promoLevel <=levels) {
				if (dbug) console.log ("addPromotions::Adding a promotion on " + promoDate[0] + " at level " + promoLevel +".");
				// add the promo period
				var j = addPeriod ({"startDate":promoDate[0],"increase":0, "reason":"promotion", "multiplier":1, "level":(promoLevel-1)});
				// remove future anniversaries
				for (var k = j; k < periods.length; k++) {
					if (periods[k]["reason"] == "Anniversary Increase") {
						periods.splice(k, 1);
					}
				}
				// add anniversaries
				var k = parseInt(promoDate[1])+1;
				if (dbug) console.log ("addPromotions::Starting with promo anniversaries k: " + k + ", and make sure it's <= " + EndDate.getFullYear() + ".");
				for (k; k <= EndDate.getFullYear(); k++) {
					if (dbug) console.log ("addPromotions::Adding anniversary date " + k + "-" + promoDate[2] + "-" + promoDate[3] + ".");
					addPeriod ({"startDate": k + "-" + promoDate[2] + "-" + promoDate[3], "increase":0, "reason":"Anniversary Increase", "multiplier":1});
				}
				saveValues.push("pdate" + i + "=" + promoDate[0]);
				saveValues.push("plvl" + i + "=" + promoLevel);

			} else {
				let errMsg = null;
				if (promoDate[0] < startDate) {
					errMsg = getStr("dateTooEarlyError");
					addErrorMessage(promoDateIn.id, errMsg);
				}
				if (promoDate[0] >= EndDate.toISOString().substr(0,10)) {
					errMsg = getStr("dateTooLateError");
					addErrorMessage(promoDateIn.id, errMsg);
				}
				if (promoLevel < 1 || promoLevel > levels) {
					errMsg = getStr("invalidLevelError"); //console.log ("addPromotions::It's greater than 0.");
					addErrorMessage(promoLevelSel.id, errMsg);
				}
				if (dbug && errMsg) console.log ("addPromotion::Error: " + errMsg + ".");
			}
		} else {
			if (dbug) console.log("addPromotions::Didn't get promoDate.");
			addErrorMessage(promoDateIn.id, getStr("dateFormatError"));
		}
	}
} // End of addPromotions

function getActings () {
	//dbug = true;
	// Add actings
	let actingStints = document.querySelectorAll(".actingStints");
	if (dbug) console.log ("getActings::Dealing with " + actingStints.length + " acting stints.");

	for (let i =0; i < actings; i++) {
		let actingLvlSel = actingStints[i].getElementsByTagName("select")[0];
		let actingLvl = actingLvlSel.value;
		let dates = actingStints[i].getElementsByTagName("input");
		let enteredActingFromDate = dates[0].value;	// What's the difference between "entered" and "effective"?
		let effectiveActingStart = dates[0].value;	// Entered is what's entered. If that's before the TABegin, then the effective date is the TABegin.
		let actingToDate = dates[1].value;
		if (dbug) console.log("getActings::Checking acting at  level " + actingLvl + " from " + enteredActingFromDate + " to " + actingToDate + ".");
		// Check if the acting level actually exists, and if the dates are in the right format.
		if (actingLvl > 0 && actingLvl <= levels && enteredActingFromDate.match(/\d\d\d\d-\d\d-\d\d/) && actingToDate.match(/\d\d\d\d-\d\d-\d\d/)) {
			if (dbug) console.log ("getActings::Passed the initial tests.  the Acting level exists and the dates are in the correct format.");
			// Check if the from date is before the TA End Date, and the To Date is after the beginning of the TA period, and that to the Do date is after the From date.
			if (enteredActingFromDate <= EndDate.toISOString().substr(0, 10) && actingToDate >= TABegin.toISOString().substr(0,10) && actingToDate > enteredActingFromDate) {
				//let to = addPeriod({"startDate":actingToDate.toISOString().substr(0, 10), "increase":0, "reason":"Acting Finished", "multiplier":1});

				let fromParts = enteredActingFromDate.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
				enteredActingFromDate = new Date(fromParts[1], (fromParts[2]-1), fromParts[3]);

				let toParts = actingToDate.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
				actingToDate = new Date(toParts[1], (toParts[2]-1), toParts[3]);

				// Is the Acting for more than 1 year?  If so, add Acting Anniversarys
				if (actingToDate >= +enteredActingFromDate + (1000*60*60*24)) {
					if (dbug) console.log ("getActings::" + actingToDate.toISOString().substr(0,10) + " is at least 1 year past " + enteredActingFromDate.toISOString().substr(0,10) + ".  So, gotta add Acting Anniversaries.");
					// From: the year after the acting start to the acting end.
					for (let j = parseInt(fromParts[1])+1; j <= toParts[1]; j++) {
						if (dbug) console.log ("getActings::j: " + j +".");
						if ((j + "-" + fromParts[2] + "-" + fromParts[3] < actingToDate.toISOString().substr(0, 10)) && (j + "-" + fromParts[2] + "-" + fromParts[3] >= TABegin.toISOString().substr(0,10)) && (j + "-" + fromParts[2] + "-" + fromParts[3] <= EndDate.toISOString().substr(0,10))) {
							addPeriod({"startDate":j + "-" + fromParts[2] + "-" + fromParts[3], "increase":0, "reason":"Acting Anniversary", "multiplier":1});
						}
					}
				} else {
					if (dbug) console.log ("getActings::Acting " + i + " is less than 1 year: from: " + enteredActingFromDate.toISOString().substr(0,10) + ", to: " + actingToDate.toISOString().substr(0,10) + ", and enteredActingFromDate + (1000*60*60*24): " + (+enteredActingFromDate + (1000*60*60*24))  +".");
				}

				// If the from-date starts before the TA begin, then re-set the from date to the start of the TA.
				if (enteredActingFromDate < TABegin && actingToDate >= TABegin) {
					// Problem is here, is that you need to account for an Acting Anniversary.  Actually, those were just added above.
					effectiveActingStart = new Date(TABegin.getFullYear(), TABegin.getMonth(), TABegin.getDate());//.toISOString().substr(0,10);
					if (dbug) console.log ("getActings::effectiveActingStart was before the TA, so gonna save " + enteredActingFromDate.toISOString().substr(0,10) + ", but gonna add period for " + effectiveActingStart.toISOString().substr(0,10) + ".");
				} else {
					effectiveActingStart = new Date(fromParts[1], (fromParts[2]-1), fromParts[3]);

				}

				if (dbug) console.log ("getActings::Gonna add the period for the effectiveActingStart: " + effectiveActingStart.toISOString().substr(0,10) + ".");
				// Now add the period for start acting
				let from = addPeriod({"startDate":effectiveActingStart.toISOString().substr(0,10), "increase":0, "reason":"Acting Start", "multiplier":1, "level":(actingLvl-1)});

				// Add a period to end the acting.
				actingToDate.setDate(actingToDate.getDate() + parseInt(1));	// Add 1 because this will be the start date of post-acting
				let to = addPeriod({"startDate":actingToDate.toISOString().substr(0, 10), "increase":0, "reason":"Acting Finished", "multiplier":1});

				saveValues.push("afrom" + i + "=" + enteredActingFromDate.toISOString().substr(0, 10));
				actingToDate.setDate(actingToDate.getDate() - parseInt(1));
				saveValues.push("ato" + i + "=" + actingToDate.toISOString().substr(0, 10));
				saveValues.push("alvl" + i + "=" + actingLvl);

				

				/*
				// If the from-date starts before the TA begin, then re-set the from date to the start of the TA.
				if (enteredActingFromDate < TABegin.toISOString().substr(0,10) && actingToDate >= TABegin.toISOString().substr(0,10)) {
					// Problem is here, is that you need to account for an Acting Anniversary
					enteredActingFromDate = TABegin.toISOString().substr(0,10);
				}
				if (dbug) console.log ("getActings::And the dates are in the right range.");
				// add a period for starting
				let from = addPeriod({"startDate":enteredActingFromDate, "increase":0, "reason":"Acting Start", "multiplier":1, "level":(actingLvl-1)});

				// add a period for returning
				let toParts = actingToDate.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
				actingToDate = new Date(toParts[1], (toParts[2]-1), toParts[3]);
				actingToDate.setDate(actingToDate.getDate() + parseInt(1));
				let to = addPeriod({"startDate":actingToDate.toISOString().substr(0, 10), "increase":0, "reason":"Acting Finished", "multiplier":1});
				let fromParts = enteredActingFromDate.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
				enteredActingFromDate = new Date(fromParts[1], (fromParts[2]-1), fromParts[3]);
				
				// Check for Acting Anniversary
				// From: the year after the acting start to the acting end.
				for (let j = parseInt(fromParts[1])+1; j <= toParts[1]; j++) {
					console.log ("getActings::j: " + j +".");
					if (j + "-" + fromParts[2] + "-" + fromParts[3] < actingToDate.toISOString().substr(0, 10)) {
						addPeriod({"startDate":j + "-" + fromParts[2] + "-" + fromParts[3], "increase":0, "reason":"Acting Anniversary", "multiplier":1});
					}
				}
				saveValues.push("afrom" + i + "=" + enteredActingFromDate.toISOString().substr(0, 10));
				actingToDate.setDate(actingToDate.getDate() - parseInt(1));
				saveValues.push("ato" + i + "=" + actingToDate.toISOString().substr(0, 10));
				saveValues.push("alvl" + i + "=" + actingLvl);
				*/
			} else {
				if (enteredActingFromDate > EndDate.toISOString().substr(0, 10)) {
					if (dbug) console.log ("getActings::actingFrom: "  + enteredActingFromDate + " is after EndDate: " + EndDate.toISOString().substr(0, 10) + ".");
					addErrorMessage(dates[0].id, getStr("dateTooLateError"));
				}
				if (actingToDate <= TABegin.toISOString().substr(0,10)) {
					if (dbug) console.log ("getActings::actingTo: " + actingToDate + " is before startDate: " + TABegin.toISOString().substr(0,10) + ".");
					addErrorMessage(dates[1].id, getStr("dateTooEarlyError"));
				}
				if (actingToDate < enteredActingFromDate) {
					if (dbug) console.log ("getActings::actingTo: "+ actingToDate + " is after actingFrom: " + enteredActingFromDate + ".");
					addErrorMessage(dates[0].id, getStr("dateWrongOrderError"));
					addErrorMessage(dates[1].id, getStr("dateWrongOrderError"));
				}
				if (dbug) {
					if (actingToDate <= EndDate.toISOString().substr(0, 10)) console.log ("getActings::actingTo is before EndDate...which shouldn't be a problem");
				}
			}
		} else {
			if (actingLvl < 1 || actingLvl > levels) {
				if (dbug) {
					if (actingLvl >=0) console.log ("getActings::actingLvl >= 0");
					if (actingLvl <5) console.log ("getActings::actingLvl < 5");
				}
				// Add Error Message
				addErrorMessage (actingLvlSel.id, getStr("invalidLevelError"));
			}
			if (!(dates[0].value.match(/\d\d\d\d-\d\d-\d\d/))) {
				addErrorMessage(dates[0].id, getStr("dateFormatError"));
			}
			if (!(dates[1].value.match(/\d\d\d\d-\d\d-\d\d/))) {
				addErrorMessage(dates[1].id, getStr("dateFormatError"));
			}
			if (dbug) {
				if (enteredActingFromDate.match(/\d\d\d\d-\d\d-\d\d/)) console.log ("getActings::actingFrom is right format.");
				if (actingToDate.match(/\d\d\d\d-\d\d-\d\d/)) console.log ("getActings::actingTo is right format.");
			}
		}
		//dbug = false;
	}
} // End of getActings

function getLWoPs () {
	// Add lwops
	var lwopStints = document.querySelectorAll(".lwopStints");
	if (dbug) console.log ("getLWoPs::Dealing with " + lwopStints.length + " lwops.");
	
	for (var i =0; i < lwopStints.length; i++) {
		var dates = lwopStints[i].getElementsByTagName("input");
		var lwopFromDate = dates[0].value;
		var lwopToDate = dates[1].value;
		if (lwopFromDate.match(/\d\d\d\d-\d\d-\d\d/) && lwopToDate.match(/\d\d\d\d-\d\d-\d\d/)) {
			if (dbug) console.log ("getLWoPs::Passed the initial tests for " + lwopFromDate + " to " + lwopToDate + ".");
			if (lwopFromDate <= EndDate.toISOString().substr(0, 10) && 
					lwopToDate >= TABegin.toISOString().substr(0,10) && 
					lwopToDate > lwopFromDate) {
				if (lwopFromDate <= TABegin.toISOString().substr(0, 10) && lwopToDate >= TABegin.toISOString().substr(0,10)) lwopFromDate = TABegin.toISOString().substr(0, 10);
				if (lwopFromDate <= EndDate.toISOString().substr(0, 10) && lwopToDate > EndDate.toISOString().substr(0, 10)) lwopToDate = EndDate.toISOString().substr(0, 10);
				if (dbug) console.log ("getLWoPs::And the dates are in the right range.");
				// add a period for starting
				var from = addPeriod({"startDate":lwopFromDate, "increase":0, "reason":"LWoP Start", "multiplier":0});

				// add a period for returning
				var toParts = lwopToDate.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
				lwopToDate = new Date(toParts[1], (toParts[2]-1), toParts[3]);
				lwopToDate.setDate(lwopToDate.getDate() + parseInt(1));
				var to = addPeriod({"startDate":lwopToDate.toISOString().substr(0, 10), "increase":0, "reason":"LWoP Finished", "multiplier":1});
				for (var j = from; j < to; j++) {
					periods[j]["multiplier"] = 0;
				}

				saveValues.push("lfrom" + i + "=" + lwopFromDate); //.toISOString().substr(0, 10));
				lwopToDate.setDate(lwopToDate.getDate() - parseInt(1));
				saveValues.push("lto" + i + "=" + lwopToDate.toISOString().substr(0, 10));
				//var fromParts = lwopFromDate.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
				//lwopFromDate = new Date(fromParts[1], (fromParts[2]-1), fromParts[3]);
			} else {
				if (lwopFromDate >= EndDate.toISOString().substr(0, 10)) {
					if (dbug) console.log ("lwopFrom is after EndDate");
					addErrorMessage(dates[0].id, getStr("dateTooLateError"));
				}
				if (lwopToDate < TABegin.toISOString().substr(0,10)) {
					if (dbug) console.log ("lwopTo is before startDate");
					addErrorMessage(dates[1].id, getStr("dateTooEarlyError"));
				}
				if (lwopToDate < lwopFromDate) {
					if (dbug) console.log ("lwopTo is before lwopFrom");
					addErrorMessage(dates[0].id, getStr("dateWrongOrderError"));
					addErrorMessage(dates[1].id, getStr("dateWrongOrderError"));
				}
			}
		} else {
			if (dbug) {
				if (lwopFromDate.match(/\d\d\d\d-\d\d-\d\d/)) {
					if (dbug) console.log ("getLWoPs::lwopFrom is right format.");
				} else {
					addErrorMessage(dates[0].id, getStr("dateFormatError"));
				}
				if (lwopToDate.match(/\d\d\d\d-\d\d-\d\d/)) {
					if (dbug) console.log ("getLWoPs::lwopTo is right format.");
				} else {
					addErrorMessage(dates[1].id, getStr("dateFormatError"));
				}
			}
		}
	}
} // End of getLWoPs
	
function getOvertimes () {
	// Add Overtimes
	let overtimeStints = document.querySelectorAll(".overtimes");
	let rates = getRates();
	if (dbug) console.log ("overtimes::Dealing with " + overtimeStints.length + " overtimes.");
	
	for (var i =0; i < overtimeStints.length; i++) {
		let overtimeDateIn = overtimeStints[i].querySelector("input[type=date]");
		let overtimeDate = overtimeDateIn.value;
		let overtimeAmountIn = overtimeStints[i].querySelector("input[type=text]");
		let overtimeAmount = overtimeAmountIn.value; //.replace(/[^\d\.]/, "");
		let overtimeRateSel = overtimeStints[i].querySelector("select");
		let overtimeRate = overtimeRateSel.value;
		if (!(rates.hasOwnProperty(overtimeRate)) || overtimeRate == "0") {
			if (dbug) console.log ("selected overtimeRate: " + overtimeRate + ".");
			addErrorMessage (overtimeRateSel.id, getStr("invalidRateError"));
		}
		if (overtimeDate.match(/\d\d\d\d-\d\d-\d\d/)) {
			if (dbug) console.log ("getOvertimes::Passed the initial tests.");
			if (overtimeDate >= TABegin.toISOString().substr(0,10) && overtimeDate <= EndDate.toISOString().substr(0, 10) && overtimeAmount > 0) {
				if (dbug) console.log ("getOvertimes::And the dates are in the right range.");
				// add a period for starting
				
				var from = addPeriod({"startDate":overtimeDate, "increase":0, "reason":"Overtime", "multiplier":0, "hours":overtimeAmount, "rate":overtimeRate});
				saveValues.push("otdate" + i + "=" + overtimeDate);
				saveValues.push("otamt" + i + "=" + overtimeAmount);
				saveValues.push("otrt" + i + "=" + overtimeRate);

			} else {
				if (overtimeDate < TABegin.toISOString().substr(0,10))  {
					if (dbug) console.log ("overtimeDate is before startDate");
					addErrorMessage(overtimeDateIn.id, getStr("dateTooEarlyError"));
				}
				if (overtimeDate > EndDate.toISOString().substr(0, 10)) {
					if (dbug) console.log ("overtimeDate is after EndDate");
					addErrorMessage(overtimeDateIn.id, getStr("dateTooLateError"));
				}
				if (overtimeAmount <= 0 || overtimeAmount.match(/\D/)) {
					if (dbug) console.log ("overtimeAmount < 0");
					addErrorMessage(overtimeAmountIn.id, getStr("otHrsError"));
				}
			}
		} else {
			if (dbug) console.log ("overtimeDate is not in the right format.");
			addErrorMessage(overtimeDateIn.id, getStr("dateFormatError"));
		}
	}
} // End of getOvertimes

function getLumpSums () {
	// Add LumpSums
	let lumpsums = document.querySelectorAll(".lumpSums");
	if (dbug) console.log ("Dealing with " + lumpsums.length + " lumpsums.");
	
	for (var i =0; i < lumpsums.length; i++) {
		let lumpSumDateIn = lumpsums[i].querySelector("input[type=date]")
		let lumpSumDate = lumpSumDateIn.value;
		let lumpSumAmountIn = lumpsums[i].querySelector("input[type=text]");//.value.replace(/[^\d\.]/, "");
		let lumpSumAmount = lumpSumAmountIn.value;
		if (lumpSumDate.match(/\d\d\d\d-\d\d-\d\d/)) {
			if (dbug) console.log ("Passed the initial tests.");
			if (lumpSumDate >= TABegin.toISOString().substr(0,10) && lumpSumDate <= EndDate.toISOString().substr(0, 10) && lumpSumAmount > 0) {
				if (dbug) console.log ("And the dates are in the right range.");
				// add a period for starting
				var from = addPeriod({"startDate":lumpSumDate, "increase":0, "reason":"Lump Sum", "multiplier":0, "hours":lumpSumAmount});

				saveValues.push("lsdate" + i + "=" + lumpSumDate);
				saveValues.push("lsamt" + i + "=" + lumpSumAmount);
				
			} else {
				if (lumpSumDate < TABegin.toISOString().substr(0,10)) {
					if (dbug) console.log ("lumpSumDate is after startDate");
					addErrorMessage(lumpSumDateIn.id, getStr("dateTooEarlyError"));
				}
				if (lumpSumDate > EndDate.toISOString().substr(0, 10)) {
					if (dbug) console.log ("lumpSumDate is before EndDate");
					addErrorMessage(lumpSumDateIn.id, getStr("dateTooLateError"));
				}
				if (lumpSumAmount <= 0 || lumpSumAmount.match(/\D/)) {
					if (dbug) console.log ("lumpSumAmount not right.");
					addErrorMessage(lumpSumAmountIn.id, getStr("otHrsError"));
				}
			}
		} else {
			if (dbug) console.log ("lumpSumDate is not in the right format.");
			addErrorMessage(lumpSumDateIn.id, getStr("dateFormatError"));
		}
	}
} // End of getLumpSums
	
/*
Defunct:

function handlePromotions () {
	//var lvl = parseInt(document.getElementById("levelSelect").value.replace(/\D/, ""));
	var promotionsDiv = document.getElementById("promotionsDiv");
	var numOfPromotions = numPromotions.value;
	for (var i = 0; i < 4; i++) {
		var newPromotionDiv = null;
		newPromotionDiv = document.getElementById("promo" + i);
		if (newPromotionDiv) {
			// It's there.  
			if (i>=numOfPromotions) {
				promotionsDiv.removeChild(newPromotionDiv);
			}
		} else {
			// It's not there.
			if (i < numOfPromotions) {
				newPromotionDiv = createHTMLElement("div", {"parentNode":promotionsDiv, "class":"fieldHolder promotions", "id":"promo"+i});
				var newPromoLbl = createHTMLElement("label", {"parentNode":newPromotionDiv, "class":"form-label", "for":"promoDate" + i, "nodeText":"Date of promotion: "});
				var newPromoDate = createHTMLElement("input", {"parentNode":newPromotionDiv, "class":"form-control", "type":"date", "id":"promoDate" + i, "aria-describedby":"dateFormat"});
	
				var newLevelLbl = createHTMLElement("label", {"parentNode":newPromotionDiv, "class":"form-label", "for":"promoLevel" + i, "nodeText":"Level promotion: "});
				var newPromoSel = createHTMLElement("select", {"parentNode":newPromotionDiv, class:"form-select", "id":"promoLevel" + i});
				for (var j = 0; j < 6; j++) {
					var newPromoOpt = createHTMLElement("option", {"parentNode":newPromoSel, "value": j, "nodeText":(j == 0 ? "Select Level" : "IT-0" + j)});
				}
			}
		}
	}
	resultStatus.innerHTML="New promotions section added.";
} // End of handlePromotions
*/

function addPromotionHandler (e, o) {
	let toFocus = true;
	let pdate = null;
	let plvl = null;
	if (arguments.length > 1) {
		let args = arguments[1];
		if (dbug) console.log ("addPromotionHandler::arguments: " + arguments.length);
		if (args.hasOwnProperty("toFocus")) toFocus = args["toFocus"];
		if (args.hasOwnProperty("date")) {
			pdate = (isValidDate(args["date"]) ? args["date"] : null);
		}
		if (args.hasOwnProperty("level")) {
			plvl = args["level"].replaceAll(/\D/g, "");
			plvl = (plvl >0 && plvl <6 ? plvl : null);
		}
		if (dbug) console.log (`addPromotionHandler::toFocus: ${toFocus}, pdate: ${pdate}, plvl: ${plvl}.`);
	}
	let promotionsDiv = document.getElementById("promotionsDiv");
	let id = promotions;
	let looking = true;
	while (looking) {
		if (document.getElementById("promotion" + id)) {
			id++;
		} else {
			looking = false;
		}
	}

	let newPromotionFS = createHTMLElement("fieldset", {"parentNode":promotionsDiv, "class":"fieldHolder promotions border border-black p-2 m-2", "id" :"promo" + id});
	let newPromotionLegend = createHTMLElement("legend", {"parentNode":newPromotionFS, "textNode":getStr("promotion") + " " + (id+1)});

	let newPromoDateDiv = createHTMLElement("div", {"parentNode":newPromotionFS, "class":"fieldHolder"});
	let newPromoLbl = createHTMLElement("label", {"parentNode":newPromoDateDiv, "class":"form-label", "for":"promoDate" + id, "nodeText": getStr("dateOfPromotion") + " "});
	let newPromoDate = createHTMLElement("input", {"parentNode":newPromoDateDiv, "class":"form-control", "type":"date", "id":"promoDate" + id, "aria-describedby":"dateFormat", "value":(pdate ? pdate : null)});
	if (toFocus) newPromoDate.focus();
	//newPromoDate.addEventListener("change", saveValue, false);

	let newPromoLvlDiv = createHTMLElement("div", {"parentNode":newPromotionFS, "class":"fieldHolder"});
	let newLevelLbl = createHTMLElement("label", {"parentNode":newPromoLvlDiv, "class":"form-label", "for":"promotionLevel" + id, "nodeText":getStr("promotedToLevel") + " "});
	let newPromotionSel = createHTMLElement("select", {"parentNode":newPromoLvlDiv, class:"form-select", "id":"promotionLevel" + id});
	for (var j = 0; j <= levels; j++) {
		var newPromoOpt = createHTMLElement("option", {"parentNode":newPromotionSel, "value": j, "nodeText":(j == 0 ? getStr("selectLevel") : getStr(classification) + "-0" + j)});
		if (plvl) {
			if (plvl == j) newPromoOpt.setAttribute("selected", "selected");
		} else {
			if (parseInt(levelSel.value)+1 == j) newPromoOpt.setAttribute("selected", "selected");
		}
	}
	//newPromotionSel.addEventListener("change", saveValue, false);

	let promoButtonsDiv = null;
	if (id == 0) {
		promoButtonsDiv = createHTMLElement("div", {"parentNode":newPromotionFS, "id":"promoButtonsDiv"});
		var newDelPromotionBtn = createHTMLElement("input", {"parentNode":promoButtonsDiv, "type":"button", class: "btn btn-warning", "value":getStr("remove"), "id": "removePromotionBtn" + promotions});
		var newAddPromotionBtn = createHTMLElement("input", {"parentNode":promoButtonsDiv, "type":"button", "value":getStr("addAnotherPromotion"), "class":"promotionsBtn btn btn-success", "id": "addPromotionsBtnn" + id});
		newAddPromotionBtn.addEventListener("click", addPromotionHandler, false);
		newDelPromotionBtn.addEventListener("click", removePromotionDiv, false);
	} else {
		promoButtonsDiv = document.getElementById("promoButtonsDiv");
		newPromotionFS.appendChild(promoButtonsDiv);
	}

	promotions++;


	resultStatus.innerHTML=getStr("newPromoAdded");
} // End of addPromotionHandler

function addActingHandler () {
	let toFocus = true;
	let afdate = null;
	let atdate = null;
	let alvl = null;
	if (arguments.length > 1) {
		let args = arguments[1];
		if (dbug) console.log ("addActingHandler::arguments: " + arguments.length);
		if (args.hasOwnProperty("toFocus")) toFocus = args["toFocus"];
		if (args.hasOwnProperty("from")) {
			// Not doing isValidDate because that will check if it's in the range.  But starting actings are allowed to start before the TA start date.
			afdate = (args["from"].match(/(\d\d\d\d)-(\d\d)-(\d\d)/) ? args["from"] : null);
		}
		if (args.hasOwnProperty("to")) {
			atdate = (isValidDate(args["to"]) ? args["to"] : null);
		}
		if (args.hasOwnProperty("level")) {
			alvl = args["level"].replaceAll(/\D/g, "");
			alvl = (alvl >0 && alvl <6 ? alvl : null);
		}
		if (dbug) console.log (`addActingHandler::toFocus: ${toFocus}, from: ${afdate} to ${atdate}, alvl: ${alvl}.`);
	}

	var actingsDiv = document.getElementById("actingsDiv");
	
	var id = actings;
	var looking = true;
	while (looking) {
		if (document.getElementById("actingLevel" + id)) {
			id++;
		} else {
			looking = false;
		}
	}

	let newActingFS = createHTMLElement("fieldset", {"parentNode":actingsDiv, "class":"fieldHolder actingStints border border-black p-2 m-2", "id":"acting"+id});
	let newActingLegend = createHTMLElement("legend", {"parentNode":newActingFS, "textNode": getStr("actingStint") + " " + (id+1)});

	let newActingFromDiv = createHTMLElement("div", {"parentNode":newActingFS, "class" : "fieldHolder"});
	let newActingFromLbl = createHTMLElement("label", {"parentNode":newActingFromDiv, "class":"form-label", "textNode":getStr("from"), "for":"actingFrom" + id});
	let newActingFromDate = createHTMLElement("input", {"parentNode":newActingFromDiv, "class":"form-control", "id":"actingFrom"+id, "type":"date", "aria-describedby":"dateFormat", "value":(afdate ? afdate : null)});
	let newActingToDiv = createHTMLElement("div", {"parentNode":newActingFS, "class" : "fieldHolder"});
	let newActingToLbl = createHTMLElement("label", {"parentNode":newActingToDiv, "class":"form-label", "textNode":getStr("to"), "for":"actingTo"+id});
	let newActingToDate = createHTMLElement("input", {"parentNode":newActingToDiv, "class":"form-control", "id":"actingTo"+id, "type":"date", "aria-describedby":"dateFormat", "value":(atdate ? atdate : null)});

	let newActingLvlDiv = createHTMLElement("div", {"parentNode":newActingFS, "class" : "fieldHolder"});
	let newLevelLbl = createHTMLElement("label", {"parentNode":newActingLvlDiv, "class":"form-label", "for":"actingLevel" + id, "nodeText":getStr("actingLevel") + " "});
	let newActingSel = createHTMLElement("select", {"parentNode":newActingLvlDiv, class:"form-select", "id":"actingLevel" + id});
	for (let j = 0; j <= levels; j++) {
		let newPromoOpt = createHTMLElement("option", {"parentNode":newActingSel, "value": j, "nodeText":(j == 0 ? getStr("selectLevel") : getStr(classification) + "-0" + j)});
		if (alvl) {
			if (alvl == j) newPromoOpt.setAttribute("selected", "selected");
		} else {
			if (parseInt(levelSel.value)+1 == j) newPromoOpt.setAttribute("selected", "selected");
		}
	}


	//newActingSel.addEventListener("change", saveValue, false);

	let actingButtonsDiv = null;
	if (id == 0) {
		actingButtonsDiv = createHTMLElement("div", {"parentNode":newActingFS, "id":"actingButtonsDiv"});
		var newDelActingBtn = createHTMLElement("input", {"parentNode":actingButtonsDiv, "type":"button", "class":"btn btn-warning", "value":getStr("remove"), "id": "removeActingBtn" + actings});
		var newAddActingBtn = createHTMLElement("input", {"parentNode":actingButtonsDiv, "type":"button", "value":getStr("addAnotherActing"), "class":"actingBtn btn btn-success", "id": "addActingsBtn" + id});
		newAddActingBtn.addEventListener("click", addActingHandler, false);
		newDelActingBtn.addEventListener("click", removeActingDiv, false);
	} else {
		actingButtonsDiv = document.getElementById("actingButtonsDiv");
		newActingFS.appendChild(actingButtonsDiv);
	}

	if (toFocus) newActingFromDate.focus();

	actings++;
	resultStatus.innerHTML=getStr("newActingAdded");
} // End of addActingHandler

function addLWoPHandler () {
	let toFocus = true;
	let lfrom = null;
	let lto = null;
	if (arguments.length > 1) {
		let args = arguments[1];
		if (dbug) console.log ("addLWoPHandler::arguments: " + arguments.length);
		if (args.hasOwnProperty("toFocus")) toFocus = args["toFocus"];
		if (args.hasOwnProperty("from")) {
			lfrom = (isValidDate(args["from"]) ? args["from"] : null);
		}
		if (args.hasOwnProperty("to")) {
			lto = (isValidDate(args["to"]) ? args["to"] : null);
		}
		if (dbug) console.log (`addLWoPHandler::toFocus: ${toFocus}, from: ${lfrom} to ${lto}.`);
	}

	var LWoPDiv = document.getElementById("LWoPDiv");

	var id = lwops;
	var looking = true;
	while (looking) {
		if (document.getElementById("lwopFrom" + id)) {
			id++;
		} else {
			looking = false;
		}
	}

	let newLWoPFS = createHTMLElement("fieldset", {"parentNode":LWoPDiv, "class":"fieldHolder lwopStints border border-black p-2 m-2", "id":"lwop"+id});
	let newLWoPLegend = createHTMLElement("legend", {"parentNode":newLWoPFS, "textNode":getStr("lwopStint") + " " + (id+1)});

	let newLWoPFromDiv = createHTMLElement("div", {"parentNode":newLWoPFS, "id":"actingButtonsDiv"});
	let newLWoPFromLbl = createHTMLElement("label", {"parentNode":newLWoPFromDiv, "class":"form-label", "textNode":getStr("from"), "for":"lwopFrom" + id});
	let newLWoPFromDate = createHTMLElement("input", {"parentNode":newLWoPFromDiv, "class":"form-control", "id":"lwopFrom"+id, "type":"date", "aria-describedby":"dateFormat", "value":(lfrom ? lfrom : null)});

	let newLWoPToDiv = createHTMLElement("div", {"parentNode":newLWoPFS, "id":"actingButtonsDiv"});
	let newLWoPToLbl = createHTMLElement("label", {"parentNode":newLWoPToDiv, "class":"form-label", "textNode":getStr("to"), "for":"lwopTo"+id});
	let newLWoPToDate = createHTMLElement("input", {"parentNode":newLWoPToDiv, "class":"form-control", "id":"lwopTo"+id, "type":"date", "aria-describedby":"dateFormat", "value" : (lto ? lto : null)});

	let lwopButtonsDiv = null;
	if (id == 0) {
		lwopButtonsDiv = createHTMLElement("div", {"parentNode":newLWoPFS, "id":"lwopButtonsDiv"});
		var newDelLWoPBtn = createHTMLElement("input", {"parentNode":lwopButtonsDiv, "type":"button", "class":"btn btn-warning", "value":getStr("remove"), "id": "removeLWoPBtn" + lwops});
		var newAddLWoPBtn = createHTMLElement("input", {"parentNode":lwopButtonsDiv, "type":"button", "value":getStr("addAnotherLwop"), "class":"lwopBtn btn btn-success", "id": "addLWoPsBtn" + id});
		newAddLWoPBtn.addEventListener("click", addLWoPHandler, false);
		newDelLWoPBtn.addEventListener("click", removeLWoPDiv, false);
	} else {
		lwopButtonsDiv = document.getElementById("lwopButtonsDiv");
		newLWoPFS.appendChild(lwopButtonsDiv);
	}

	
	lwops++;
	if (toFocus) newLWoPFromDate.focus();
	resultStatus.innerHTML=getStr("newLwopSection");
} // End of lWoPHandler

function addOvertimeHandler () {
	let toFocus = true;
	let otdate = null;
	let othours = null;
	let otrate = null;
	if (arguments.length > 1) {
		let args = arguments[1];
		if (dbug) console.log ("addOvertimeHandler::arguments: " + arguments.length);
		if (args.hasOwnProperty("toFocus")) toFocus = args["toFocus"];
		if (args.hasOwnProperty("date")) {
			otdate = (isValidDate(args["date"]) ? args["date"] : null);
		}
		if (args.hasOwnProperty("hours")) {
			othours = (args["hours"] ? args["hours"] : null);
		}
		if (args.hasOwnProperty("rate")) {
			otrate = (["rate"] ? args["rate"] : null);
		}
		if (dbug) console.log (`addOvertimeHandler::toFocus: ${toFocus}, date: ${otdate} hours ${othours}, rate: ${otrate}.`);
	}

	let OvertimeDiv = document.getElementById("overtimeDiv");

	let id = overtimes;
	let looking = true;
	while (looking) {
		if (document.getElementById("overtimeDate" + id)) {
			id++;
		} else {
			looking = false;
		}
	}
	let newOvertimeFS = createHTMLElement("fieldset", {"parentNode":OvertimeDiv, "class":"fieldHolder overtimes border border-black p-2 m-2", "id":"ot" + id});
	let newOvertimeLegend = createHTMLElement("legend", {"parentNode":newOvertimeFS, "textNode":getStr("otOrStby") + " " + (id+1)});

	let newDateFieldHolder = createHTMLElement("div", {"parentNode":newOvertimeFS, "class":"fieldHolder"});
	let newOvertimeDateLbl = createHTMLElement("label", {"parentNode":newDateFieldHolder, "class":"form-label", "textNode":getStr("dtOfOT"), "for":"overtimeDate" + id});
	let newOvertimeDate = createHTMLElement("input", {"parentNode":newDateFieldHolder, "class":"form-control", "id":"overtimeDate"+id, "type":"date", "aria-describedby":"dateFormat", "value":(otdate ? otdate : null)});


	let newAmountFieldHolder = createHTMLElement("div", {"parentNode":newOvertimeFS, "class":"fieldHolder"});
	let newOvertimeAmountLbl = createHTMLElement("label", {"parentNode":newAmountFieldHolder, "class":"form-label", "textNode":getStr("hrsOT"), "for":"overtimeAmount" + id});
	let newOvertimeAmount = createHTMLElement("input", {"parentNode":newAmountFieldHolder, "class":"form-control", "id":"overtimeAmount"+id, "type":"text", "value" : (othours ? othours : "")});

	let newRateFieldHolder = createHTMLElement("div", {"parentNode":newOvertimeFS, "class":"fieldHolder"});
	let newOvertimeRateLbl = createHTMLElement("label", {"parentNode":newRateFieldHolder, "class":"form-label", "textNode":getStr("OTRate"), "for":"overtimeRate" + id});
	let newOvertimeRate = createHTMLElement("select", {"parentNode":newRateFieldHolder, class:"form-select", "id":"overtimeRate"+id});
	let rates = getRates();  //{"0" : getStr("selectOTRate"), "0.125" : "1/8x - " + getStr("standby"), "1.0" : "1.0", "1.5" : "1.5", "2.0": "2.0"};
	//createHTMLElement("option", {"parentNode":newOvertimeRate, "value":"0", "nodeText":getStr("selectOTRate")});
	
	for (let r in rates) {
		let rt = createHTMLElement("option", {"parentNode":newOvertimeRate, "value":r, "nodeText": rates[r]});
		if (otrate && otrate == r) rt.setAttribute("selected", "selected");
	}


	let otButtonsDiv = null;
	if (id == 0) {
		otButtonsDiv = createHTMLElement("div", {"parentNode":newOvertimeFS, "id":"otButtonsDiv"});
		var newDelOvertimeBtn = createHTMLElement("input", {"parentNode":otButtonsDiv, "type":"button", "class":"btn btn-warning", "value":getStr("remove"), "id": "removeOvertimeBtn" + overtimes});
		var newAddOvertimeBtn = createHTMLElement("input", {"parentNode":otButtonsDiv, "type":"button", "value":getStr("addAnotherOvertime"), "class":"otBtn btn btn-success", "id": "addOvertimesBtn" + id});
		newAddOvertimeBtn.addEventListener("click", addOvertimeHandler, false);
		newDelOvertimeBtn.addEventListener("click", removeOvertimeDiv, false);
	} else {
		otButtonsDiv = document.getElementById("otButtonsDiv");
		newOvertimeFS.appendChild(otButtonsDiv);
	}
	if (toFocus) newOvertimeDate.focus();
	overtimes++;

	resultStatus.innerHTML= getStr("newOTSection");
} // End of addOvertimeHandler

function getRates () {
	return {"0" : getStr("selectOTRate"), "0.125" : "1/8x - " + getStr("standby"), "1.0" : "1.0", "1.5" : "1.5", "2.0": "2.0"};
} // End of getRates

function addLumpSumHandler () {
	let toFocus = true;
	let lsdate = null;
	let lshours = null;
	if (arguments.length > 1) {
		let args = arguments[1];
		if (dbug) console.log ("addLumpSumHandler::arguments: " + arguments.length);
		if (args.hasOwnProperty("toFocus")) toFocus = args["toFocus"];
		if (args.hasOwnProperty("date")) {
			lsdate = (isValidDate(args["date"]) ? args["date"] : null);
		}
		if (args.hasOwnProperty("hours")) {
			lshours = (args["hours"] ? args["hours"] : null);
		}
		if (dbug) console.log (`addLumpSumHandler::toFocus: ${toFocus}, date: ${lsdate} hours ${lshours}.`);
	}

	var LumpSumDiv = document.getElementById("lumpSumDiv");

	var id = lumpSums;
	var looking = true;
	while (looking) {
		if (document.getElementById("lumpSumDate" + id)) {
			id++;
		} else {
			looking = false;
		}
	}
	var newLumpSumFS = createHTMLElement("fieldset", {"parentNode":LumpSumDiv, "class":"fieldHolder lumpSums border border-black p-2 m-2", "id":"lumpSum" + id});
	var newLumpSumLegend = createHTMLElement("legend", {"parentNode":newLumpSumFS, "textNode": getStr("Lump Sum") + " " + (id+1)});

	var newDateFieldHolder = createHTMLElement("div", {"parentNode":newLumpSumFS, "class":"fieldHolder"});
	var newLumpSumDateLbl = createHTMLElement("label", {"parentNode":newDateFieldHolder, "class":"form-label", "textNode": getStr("dtPdOut"), "for":"lumpSumDate" + id});
	var newLumpSumDate = createHTMLElement("input", {"parentNode":newDateFieldHolder, "class":"form-control", "id":"lumpSumDate"+id, "type":"date", "aria-describedby":"dateFormat", "value" : (lsdate ? lsdate : null)});

	var newAmountFieldHolder = createHTMLElement("div", {"parentNode":newLumpSumFS, "class":"fieldHolder"});
	var newLumpSumAmountLbl = createHTMLElement("label", {"parentNode":newAmountFieldHolder, "class":"form-label", "textNode": getStr("hrsLumpSum"), "for":"lumpSumAmount" + id});
	var newLumpSumAmount = createHTMLElement("input", {"parentNode":newAmountFieldHolder, "class":"form-control", "id":"lumpSumAmount"+id, "type":"text", "value" : (lshours ? lshours : "")});


	let lumpSumButtonsDiv = null;
	if (id == 0) {
		lumpSumButtonsDiv = createHTMLElement("div", {"parentNode":newLumpSumFS, "id":"lumpSumButtonsDiv"});
		var newDelLumpSumBtn = createHTMLElement("input", {"parentNode":lumpSumButtonsDiv, "type":"button", "class":"btn btn-warning", "value":getStr("remove"), "id": "removeLumpSumBtn" + lumpSums});
		var newAddLumpSumBtn = createHTMLElement("input", {"parentNode":lumpSumButtonsDiv, "type":"button", "value":getStr("addAnotherLumpSum"), "class":"lumpSumBtn btn btn-success", "id": "addLumpSumsBtn" + id});
		newAddLumpSumBtn.addEventListener("click", addLumpSumHandler, false);
		newDelLumpSumBtn.addEventListener("click", removeLumpSumDiv, false);
	} else {
		lumpSumButtonsDiv = document.getElementById("lumpSumButtonsDiv");
		newLumpSumFS.appendChild(lumpSumButtonsDiv);
	}

	if (toFocus) newLumpSumDate.focus();


	/*
	var newDelLumpSumBtn = createHTMLElement("input", {"parentNode":newLumpSumFS, "type":"button", "class":"btn btn-warning", "value":getStr("remove"), "id": "removeLumpSumBtn" + id});
	var newAddLumpSumBtn = createHTMLElement("input", {"parentNode":newLumpSumFS, "type":"button", "value":"Add another Lump Sum period", "class":"lumpsumBtn btn btn-success", "id":"addLumpSumsBtn" + id});
	newAddLumpSumBtn.addEventListener("click", addLumpSumHandler, false);
	newDelLumpSumBtn.addEventListener("click", removeLumpSumDiv, false);
	*/
	lumpSums++;
	resultStatus.innerHTML=getStr("newLumpSumSection");
} // End of addLumpSum Handler

function removePromotionDiv (e) {
	let promoButtonsDiv = null;
	let promoFS = null;
	let promoDate = null;
	let rmPromoFS = null;
	
	promoButtonsDiv = document.getElementById("promoButtonsDiv");

	promotions--;
	rmPromoFS = document.getElementById("promo" + promotions);
	if (promotions == 0) {
		addPromotionBtn.focus();
	} else {
		promoFS = document.getElementById("promo" + (promotions-1));
		if (promoFS) promoFS.appendChild(promoButtonsDiv);
		promoDate = document.getElementById("promoDate" + (promotions-1));
		if (promoDate) promoDate.focus();
	}

	rmPromoFS.parentNode.removeChild(rmPromoFS);
	rmPromoFS = null;

	resultStatus.innerHTML= getStr("promoSectionRemoved");
} // End of removePromotionDiv

function removeActingDiv (e) {
	let actingButtonsDiv = null;
	let actingFS = null;
	let actingFromDate = null;
	let rmActingFS = null;
	
	actingButtonsDiv = document.getElementById("actingButtonsDiv");

	actings--;
	rmActingFS = document.getElementById("acting" + actings);
	if (actings == 0) {
		addActingBtn.focus();
	} else {
		actingFS = document.getElementById("acting" + (actings-1));
		if (actingFS) actingFS.appendChild(actingButtonsDiv);
		actingFromDate = document.getElementById("actingFromDate" + (actings-1));
		if (actingFromDate) actingFromDate.focus();
	}

	rmActingFS.parentNode.removeChild(rmActingFS);
	rmActingFS = null;


	resultStatus.innerHTML= getStr("actingSectionRemoved");
} // End of removeActingDiv
function removeLWoPDiv (e) {
	let lwopButtonsDiv = null;
	let lwopFS = null;
	let lwopDate = null;
	let rmLwopFS = null;
	
	lwopButtonsDiv = document.getElementById("lwopButtonsDiv");

	lwops--;
	rmLwopFS = document.getElementById("lwop" + lwops);
	if (lwops == 0) {
		addLwopBtn.focus();
	} else {
		lwopFS = document.getElementById("lwop" + (lwops-1));
		if (lwopFS) lwopFS.appendChild(lwopButtonsDiv);
		lwopDate = document.getElementById("lwopFrom" + (lwops-1));
		if (lwopDate) lwopDate.focus();
	}

	rmLwopFS.parentNode.removeChild(rmLwopFS);
	rmLwopFS = null;
	resultStatus.innerHTML= getStr("lwopSectionRemoved");
} // End of removeLWoPDiv

function removeOvertimeDiv (e) {
	let otButtonsDiv = null;
	let otFS = null;
	let otDate = null;
	let rmOTFS = null;
	
	otButtonsDiv = document.getElementById("otButtonsDiv");

	overtimes--;
	rmOTFS = document.getElementById("ot" + overtimes);
	if (overtimes == 0) {
		addOvertimeBtn.focus();
	} else {
		otFS = document.getElementById("ot" + (overtimes-1));
		if (otFS) otFS.appendChild(otButtonsDiv);
		otDate = document.getElementById("overtimeDate" + (overtimes-1));
		if (otDate) otDate.focus();
	}

	rmOTFS.parentNode.removeChild(rmOTFS);
	rmOTFS = null;

	resultStatus.innerHTML= getStr("OTSectionRemoved");
} // End of removeOvertimeDiv

function removeLumpSumDiv (e) {
	let lumpSumButtonsDiv = null;
	let lumpSumFS = null;
	let lumpSumDate = null;
	let rmLumpSumFS = null;
	
	lumpSumButtonsDiv = document.getElementById("lumpSumButtonsDiv");

	lumpSums--;
	rmLumpSumFS = document.getElementById("lumpSum" + lumpSums);
	if (lumpSums == 0) {
		addLumpSumBtn.focus();
	} else {
		lumpSumFS = document.getElementById("lumpSum" + (lumpSums-1));
		if (lumpSumFS) lumpSumFS.appendChild(lumpSumButtonsDiv);
		lumpSumDate = document.getElementById("lumpSumDate" + (lumpSums-1));
		if (lumpSumDate) lumpSumDate.focus();
	}

	rmLumpSumFS.parentNode.removeChild(rmLumpSumFS);
	rmLumpSumFS = null;

	/*
	var btn= e.target;
	var btnID = btn.getAttribute("id")
	btnID = btnID.replaceAll(/\D/g, "");
	if (btnID > 0) btnID--;
	var fs = btn.parentNode;
	fs.parentNode.removeChild(fs);
	lumpSums--;
	if (lumpSums == 0 || btnID < 0) {
		addLumpSumBtn.focus();
	} else {
		let lumpSumBtns = null;
		lumpSumBtns = document.getElementById("addLumpSumsBtn" + btnID);
		if (!lumpSumBtns) {
			for (var j = btnID; lumpSumBtns === null && j >0; j--) {
				lumpSumBtns = document.getElementById("addLumpSumsBtn" + j);
			}
			if (j == 0) lumpSumBtns = addLumpSumBtn;
		}
		

		try {
			lumpSumBtns.focus();
		}
		catch (ex) {
			console.error ("Exception: " + ex.toString());
			addLumpSumBtn.focus();
		}
	}
	*/
	resultStatus.innerHTML= getStr("lumpSumSectionRemoved");
} // End of removeLumpSumDiv


function addPeriod (p) {
	let rv = null;
	if (dbug) console.log ("addPeriod::Gonna add period beginnging at " + p["startDate"] + " to periods (" + periods.length + ").");
	if (p["reason"] == "end") periods.push(p);
	if (p.startDate < periods[0]["startDate"]) return;
	let looking = true;
	if (p["startDate"] == periods[0]["startDate"]) {
		if (p["reason"] == "Anniversary Increase") {
			periods[0]["reason"] += " & " + p["reason"];
			looking = false;
			if (dbug) console.log ("addPeriod::Not gonna add this period because the anniversary date is the same as the first date of the CA.");
		}
	}
	if (p["reason"] == "Anniversary Increase" && dbug) {
		if (looking) {
			console.log ("addPeriod::Gonna start looking for the place to insert this anniversary increase.")
		} else {
			console.log ("addPeriod::Would look for the anniversary but looking is false.");
		}
	}
	for (let i = 1; i < periods.length && looking; i++) {
		//if (/*p["reason"] == "Anniversary Increase" && */dbug) console.log ("addPeriod::["+i+"]Is p[startDate](" + p["startDate"] + ") before periods["+i+"][startDate](" + periods[i]["startDate"] + ")?");
		if (p["startDate"] < periods[i]["startDate"]) {
			if (/*p["reason"] == "Anniversary Increase" && */dbug) console.log ("addPeriod::["+i+"]It is before the periods["+i+"][\"startDate\"]!");
			if (p["reason"] == "Lump Sum") {
				if (lumpSumPeriods.hasOwnProperty(periods["startDate"])) {
					lumpSumPeriods[periods[i-1]["startDate"]] += p["hours"];
					if (dbug) console.log ("Adding lump sum amount to " + periods[i-1]["startDate"] + " of " +p["hours"] + ".");
				} else {
					lumpSumPeriods[periods[i-1]["startDate"]] = p["hours"];
					if (dbug) console.log ("Adding lump sum amount for " + periods[i-1]["startDate"] + " of " +p["hours"] + ".");
				}
				looking = false;
			} else if (p["reason"] == "Overtime") {
				//dbug = true;
				if (dbug) console.log ("Does overtimePeriods have anything in " + periods[i-1]["startDate"] + "?");
				if (overtimePeriods.hasOwnProperty(periods[i-1]["startDate"])) {
					if (dbug) console.log ("Yes.  But does it have anything in rate: " + p["rate"] + "?");
					if (overtimePeriods[periods[i-1]["startDate"]].hasOwnProperty(p["rate"])) {
						if (dbug) console.log("Yup.  So gonna add " + periods[i-1]["startDate"][p["rate"]] + " to " + p["hours"] +".");
						overtimePeriods[periods[i-1]["startDate"]][p["rate"]] = (overtimePeriods[periods[i-1]["startDate"]][p["rate"]]*1) + (p["hours"]*1);
						if (dbug) console.log ("Adding overtime amount to " + periods[i-1]["startDate"] + " of " +p["hours"] + " x " + p["rate"] + ".");
						if (dbug) console.log ("And it came to " + overtimePeriods[periods[i-1]["startDate"]][p["rate"]] +".");
					} else {
						if (dbug) console.log ("No, so gonna set amount " + p["hours"] + " to " + periods[i-1]["startDate"][p["rate"]] + ".");
						overtimePeriods[periods[i-1]["startDate"]][p["rate"]] = p["hours"];
						if (dbug) console.log ("Adding overtime amount for " + periods[i-1]["startDate"] + " of " +p["hours"] + " x " + p["rate"] + " to equal " + overtimePeriods[periods[i-1]["startDate"]][p["rate"]] + " which should be " + p["hours"] + ".");
					}
				} else {
					if (dbug) console.log ("No.  So gonna add one.");
					if (dbug) console.log("addPeriod::p[rate]: " + p["rate"] + ".");
					if (dbug) console.log("addPeriod::p[hours]: " + p["hours"] + ".");
					overtimePeriods[periods[i-1]["startDate"]] = {};
					overtimePeriods[periods[i-1]["startDate"]][p["rate"]] = p["hours"];
					if (dbug) console.log("addPeriod::Now in " + periods[i-1]["startDate"] + " at rate of " + p["rate"] + ": " + overtimePeriods[periods[i-1]["startDate"]][p["rate"]] + ".");
				}
				looking = false;
				//dbug = false;
			} else {
				//if (p["reason"] == "Anniversary Increase" && dbug) console.log ("addPeriod::Adding anniversary increase.");
				//dbug = true;
				if (dbug) console.log ("addPeriod:: Adding period for reason " + p["reason"] + ", from: " + p["startDate"] + ".");
				periods.splice(i, 0, p);
				rv = i;
				looking = false;
				if (p["reason"]=="end") {
					periods.splice(i+1);
					rv = periods.length-1;
				}
				//dbug = false;
			}
		} else if (p["startDate"] == periods[i]["startDate"]) {
			if (/*p["reason"] == "Anniversary Increase" && */dbug) console.log ("addPeriod::["+i+"]It's the same date!");
			if (p["reason"] == "Phoenix") {
				periods[i]["reason"] += " & Phoenix";
				looking = false;
				rv = i;
			} else if (p["reason"] == "Anniversary Increase" && periods[i]["reason"].match(/Contractual/)) {
				periods[i]["reason"] += " & Anniversary Increase";
				looking = false;
				rv = i;
			}
		} else {
			//if (/*p["reason"] == "Anniversary Increase" && */dbug) console.log ("addPeriod::["+i+"]It's after.");
		}
	}
	return rv;
} // End of addPeriod

function calculate() {
	resultStatus.innerHTML="";
	//if (step == salaries[level].length -1) {
		//if (dbug) console.log ("Top of your level.  This should be easy.");
		if (dbug) {
			console.log ("\n\nCalculating:  There are " + periods.length + " periods to be concerned with.");
			console.log ("With salary: " + salaries[level][step] + ".");
		}
		let actingStack = [];
		let multiplier = 1;
		//let newSalaries = JSON.parse(JSON.stringify(salaries));
		//let newDaily = JSON.parse(JSON.stringify(daily));
		//let newHourly = JSON.parse(JSON.stringify(hourly));
		let preTotal = {"made":0, "shouldHaveMade":0, "backpay":0};	// What the heck are these?
		let pTotal = {"made":0, "shouldHaveMade":0, "backpay":0};
		let total = {"made":0, "shouldHaveMade":0, "backpay":0};
		if (dbug) {
			for (let i = 0; i < periods.length; i++) {
				console.log (periods[i]["reason"] + ": " + periods[i]["startDate"] + ".");
			}
		}
		let theYear = "current";
		for (let i = 0; i < periods.length-1; i++) {
			if (dbug) console.log(i + ": " + periods[i]["startDate"] + ":");
			if (dbug) console.log (i + ": going between " + periods[i]["startDate"] + " and " + periods[i+1]["startDate"] + " for the reason of " + periods[i]["reason"] + ".");
			if (periods[i]["reason"].match(/Anniversary Increase/)) {
				let output = "";
				if (actingStack.length == 0) {
					if (i ==0) {
						output += "Not increasing step because this is the first anniversary, and your anniversary is on this date.";
					} else {
						output += "Increasing step from " + step + " to ";
						step = Math.min(parseInt(step) + 1, salaries[level].length-1);	// Should this be salaries, or newRates[theYear]?
						output += step + ".";
					}
				} else {
					output += "Increasing non-acting step from " + actingStack[0]["step"] + " to ";
					actingStack[0]["step"] = Math.min(parseInt(actingStack[0]["step"]) +1, salaries[actingStack[0]["level"]].length-1);
					output += actingStack[0]["step"] + ".";
				}
				if (dbug) console.log (output);
			} else if (periods[i]["reason"] == "Acting Anniversary") {
				//dbug = true;
				var output = "Increasing step from " + step + " to ";
				step = Math.min(step + 1, salaries[level].length-1);
				output += step + "."
				if (dbug) console.log (output);
				//dbug = false;
			} else if (periods[i]["reason"] == "promotion") {
				//var currentSal = salaries[level][step];
				let currentSal = newRates["current"][level][step]["annual"];
				let minNewSal = currentSal * 1.04;
				level = periods[i]["level"];
				let looking = true;
				//for (var stp = 0; stp < salaries[level].length && looking; stp++) {
				for (let stp = 0; stp < newRates["current"][level].length && looking; stp++) {
					//if (salaries[level][stp] > minNewSal) {
					if (newRates["current"][level][stp]["annual"] > minNewSal) {
						step = stp;
						looking = false;
					}
				}
			} else if (periods[i]["reason"] == "Acting Start") {
				actingStack.push({"level":level, "step":step});
				//var currentSal = salaries[level][step];
				let currentSal = newRates["current"][level][step]["annual"];
				let minNewSal = currentSal * 1.04;
				level = periods[i]["level"];
				let looking = true;
				//for (var stp = 0; stp < salaries[level].length && looking; stp++) {
				for (let stp = 0; stp < newRates["current"][level].length && looking; stp++) {
					//if (salaries[level][stp] > minNewSal) {
					if (newRates["current"][level][stp]["annual"] > minNewSal) {
						step = stp;
						looking = false;
					}
				}

			} else if (periods[i]["reason"] == "Acting Finished") {
				var orig = actingStack.pop();
				step = orig["step"];
				level = orig["level"];
			}/* else if (periods[i]["reason"].match(/Contractual Increase/)) {
				theYear = periods[i]["startDate"];
				if (dbug || true) console.log ("Setting theYear to " + theYear + ".");
			}*/

			if (periods[i]["increaes"] > 0) {
				theYear = periods[i]["startDate"];
				if (dbug) console.log ("Setting theYear to " + theYear + ".");
			} else {
				if (periods[i].hasOwnProperty("exceptions")) {
					for (let exps = 0; exps < periods[i]["exceptions"].length; exps++) {
						if (periods[i]["exceptions"][exps]["increase"] > 0) {
							theYear = periods[i]["startDate"];
							if (dbug) console.log ("Setting theYear to " + theYear + ".");
						}
					}
				}
			}
			periods[i]["made"] = 0;
			periods[i]["shouldHaveMade"] = 0;
			periods[i]["backpay"] = 0;

			/*
			multiplier =(1 + (periods[i]["increase"]/100));
			if (periods[i].hasOwnProperty("exceptions")) {
				for (let k = 0; k < periods[i]["exceptions"].length; k++) {
					if (periods[i]["exceptions"][k]["level"] == (level-1)) {
						if (periods[i]["exceptions"][k].hasOwnProperty("increase")) {
							multiplier  = ((periods[i]["exceptions"][k]["increase"]/100) +1);
						}
					}
				}		
			}
			if (dbug) console.log ("Multiplier: " + multiplier + ".");
			
			if (periods[i]["increase"] > 0) {
				// Calculate new salaries, dailys, and hourlys
				for (var l = 0; l < newSalaries.length; l++) {
					for (var s = 0; s < newSalaries[l].length; s++) {
						//if (dbug && l == level) console.log ("Multiplying " + newSalaries[l][s] + " * " + multiplier + ".");
						newSalaries[l][s] = (newSalaries[l][s] * multiplier).toFixed(2);
						newDaily[l][s] = (newSalaries[l][s] / 260.88); //.toFixed(2);
						newHourly[l][s] = (newSalaries[l][s] / 1956.6); //.toFixed(2);
						//if (dbug && l == level) console.log ("And it came to " + newSalaries[l][s] + ".");
					}
				}
				if (dbug) console.log ("Your annual salary went from " + salaries[level][step] + " to " + newSalaries[level][step] + ".");
			}
			*/
			var days = 0;
			if (step >= 0) {
				if (dbug) console.log ("current period: periods[" + i + "][startDate]: " + periods[i]["startDate"] + ".");
				if (dbug) console.log ("future period: periods[" + (i+1) + "][startDate]: " + periods[(i+1)]["startDate"] + ".");
				var dparts = periods[i]["startDate"].match(/(\d\d\d\d)-(\d\d?)-(\d\d?)/);
				var current = new Date(dparts[1], dparts[2]-1, dparts[3]);
				parts = periods[i+1]["startDate"].match(/(\d\d\d\d)-(\d\d?)-(\d\d?)/);
				var future = new Date(parts[1], parts[2]-1, parts[3]);
				//future.setDate(future.getDate() - 1);
				var diff = (future  - current) / day;
				if (dbug) {
					//console.log ("There were " + diff + " days between " + current.getFullYear() + "-" +  (current.getMonth()+1) +"-" + current.getDate() + " and " + future.getFullYear() + "-" + (future.getMonth()+1) + "-" + future.getDate() +".");
					console.log ("Gonna calculate backpay based on current: " + newRates["current"][level][step]["daily"] + " and new ("+ theYear + "): " + newRates[theYear][level][step]["daily"] + ".");
				}
				while (current < future) {
					//if (dbug) console.log ("Now calculating for day " + current.toString() + ".");
					if (current.getDay() > 0 && current.getDay() < 6) {	// don't calculate weekends
						days++;
						//periods[i]["made"] = periods[i]["made"] + daily[level][step] * periods[i]["multiplier"];	// multiplier is if you were there then or not.
						//periods[i]["shouldHaveMade"] = (periods[i]["shouldHaveMade"] + (newDaily[level][step] * periods[i]["multiplier"]));
						
						periods[i]["made"] = periods[i]["made"] + newRates["current"][level][step]["daily"] * periods[i]["multiplier"];	// multiplier is if you were there then or not.
						periods[i]["shouldHaveMade"] = (periods[i]["shouldHaveMade"] + (newRates[theYear][level][step]["daily"] * periods[i]["multiplier"]));
					}
					current.setDate(current.getDate() + parseInt(1));
		//			//if (dbug) console.log ("Now day is " + current.toString() + ".");
				}
			} else {
				if (dbug) console.log (periods[i]["startDate"] + ": Step is still " + step + " therefore, not adding anything to made.");
			}
			periods[i]["backpay"] = periods[i]["shouldHaveMade"] - periods[i]["made"];

			var newTR = createHTMLElement("tr", {"parentNode":resultsBody});
			let endDate = new Date(periods[i+1]["startDate"]);
			endDate.setDate(endDate.getDate() -1);
			var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": periods[i]["startDate"] + " - " + endDate.toISOString().substr(0,10)});
			var reasonDiv = createHTMLElement("div", {"parentNode":newPaidTD, "textNode":"(" + getStr(periods[i]["reason"]) + ")", "class":"small"});
			var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(periods[i]["made"])}); //.toFixed(2)});
			var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(periods[i]["shouldHaveMade"])}); //.toFixed(2)});
			var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(periods[i]["backpay"])}); //.toFixed(2)});

			if (dbug || showExtraCols) {
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": getStr(classification) + "-0" + (level +1)});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": (Math.max(1, (parseInt(step)+1)))});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": (periods[i]["multiplier"] ? getStr("yes") : getStr("no"))});
				//var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": (step >=0 ? (daily[level][step] * periods[i]["multiplier"]).toFixed(2) + " -> " + (newDaily[level][step] * periods[i]["multiplier"]).toFixed(2) : "0") + " / " + getStr("day")});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "innerHTML": (step >=0 ? formatter.format(newRates["current"][level][step]["daily"] * periods[i]["multiplier"]) + " <span class=\"invisibleStuff\">" + getStr("to") + "</span><span aria-hidden=\"true\">-></span> " + formatter.format(newRates[theYear][level][step]["daily"] * periods[i]["multiplier"]) : "0") + " / " + getStr("day")});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": days});
			}
			
			if (overtimePeriods.hasOwnProperty(periods[i]["startDate"])) {
				if (dbug) console.log ("Yup there are OT for " + periods[i]["startDate"] + ".");
				for (var rate in overtimePeriods[periods[i]["startDate"]]) {
					if (dbug) console.log ("rate: " + rate + ".");
					if (dbug) console.log ("amount: " + overtimePeriods[periods[i]["startDate"]][rate] + ".");

					//var made = overtimePeriods[periods[i]["startDate"]][rate] * hourly[level][step] * rate;
					//var shouldHaveMade = overtimePeriods[periods[i]["startDate"]][rate] * newHourly[level][step] * rate;
					let made = overtimePeriods[periods[i]["startDate"]][rate] * newRates["current"][level][step]["hourly"] * rate;
					let shouldHaveMade = overtimePeriods[periods[i]["startDate"]][rate] * newRates[theYear][level][step]["hourly"] * rate;
					var backpay = shouldHaveMade - made;
					
					var newTR = createHTMLElement("tr", {"parentNode":resultsBody});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": periods[i]["startDate"] + " - " + endDate.toISOString().substr(0,10)});
					var reasonDiv = createHTMLElement("div", {"parentNode":newPaidTD, "textNode": "(" + getStr("OTPayment") + " " + rate + ")", "class":"small"});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(made)}); //.toFixed(2)});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(shouldHaveMade)}); //.toFixed(2)});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(backpay)}); //.toFixed(2)});

					if (dbug || showExtraCols) {
						var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": getStr(classification) + "-0" + (level +1)});
						var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": parseInt(step)+1});
						var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": (periods[i]["multiplier"] ? getStr("no") : getStr("yes"))});
						//var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": hourly[level][step] * periods[i]["multiplier"] + " * " + rate + "/hr"});
						var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "innerHTML": formatter.format(newRates["current"][level][step]["hourly"] * periods[i]["multiplier"]) + " <span class=\"invisibleStuff\">" + getStr("to") + "</span><span aria-hidden=\"true\">-></span> " + formatter.format(newRates[theYear][level][step]["hourly"] * periods[i]["multiplier"]) + " * " + rate + "/hr"});
						var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": overtimePeriods[periods[i]["startDate"]][rate] + " " + getStr("hours")});
					}
	
					periods[i]["made"] += made;
					periods[i]["shouldHaveMade"] += shouldHaveMade;
					periods[i]["backpay"] += backpay;
				}
			} else {
				if (dbug) console.log ("Nope, there aren't OT for " + periods[i]["startDate"] + ".");
			}
			//dbug = false;

			if (lumpSumPeriods.hasOwnProperty(periods[i]["startDate"])) {
				//var made = lumpSumPeriods[periods[i]["startDate"]] * hourly[level][step];
				//var shouldHaveMade = lumpSumPeriods[periods[i]["startDate"]] * newHourly[level][step];
				let made = lumpSumPeriods[periods[i]["startDate"]] * newRates["current"][level][step]["hourly"];
				let shouldHaveMade = lumpSumPeriods[periods[i]["startDate"]] * newRates[theYear][level][step]["hourly"];
				var backpay = shouldHaveMade - made;
				
				var newTR = createHTMLElement("tr", {"parentNode":resultsBody});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": periods[i]["startDate"]+ " - " + endDate.toISOString().substr(0,10)});
				var reasonDiv = createHTMLElement("div", {"parentNode":newPaidTD, "textNode":"(" + getStr("lumpSumPayment") + ")", "class":"small"});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(made)}); //.toFixed(2)});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(shouldHaveMade)}); //.toFixed(2)});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(backpay)}); //.toFixed(2)});

				
				if (dbug || showExtraCols) {
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": getStr(classification) + "-0" + (level +1)});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": parseInt(step)+1});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": (periods[i]["multiplier"] ? getStr("no") : getStr("yes"))});
					//var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": hourly[level][step] * periods[i]["multiplier"] + "/hr"});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(newRates[theYear][level][step]["hourly"] * periods[i]["multiplier"]) + "/hr"});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": getStr("hourly") + ": " + lumpSumPeriods[periods[i]["startDate"]]});
				}

				periods[i]["made"] += made;
				periods[i]["shouldHaveMade"] += shouldHaveMade;
				periods[i]["backpay"] += backpay;
			}
			
			/*
			if (periods[i]["startDate"] < phoenixDateTxt.value) {
				preTotal["made"] += periods[i]["made"];
				preTotal["shouldHaveMade"] += periods[i]["shouldHaveMade"];
				preTotal["backpay"] += periods[i]["backpay"];
			} else {
				pTotal["made"] += periods[i]["made"];
				pTotal["shouldHaveMade"] += periods[i]["shouldHaveMade"];
				pTotal["backpay"] += periods[i]["backpay"];
			}
			*/
			total["made"] += periods[i]["made"];
			total["shouldHaveMade"] += periods[i]["shouldHaveMade"];
			total["backpay"] += periods[i]["backpay"];
			
		}
		if (resultsFoot) {
			/*
			var preTotalTR = createHTMLElement("tr", {"parentNode":resultsFoot});
			var preTH = createHTMLElement("th", {"parentNode":preTotalTR, "scope":"row", "nodeText":"Pre-Phoenix Total"});
			var preTD = createHTMLElement("td", {"parentNode":preTotalTR, "nodeText":"$" + preTotal["made"].toFixed(2)});
			var preTD = createHTMLElement("td", {"parentNode":preTotalTR, "nodeText":"$" + preTotal["shouldHaveMade"].toFixed(2)});
			var preTD = createHTMLElement("td", {"parentNode":preTotalTR, "nodeText":"$" + preTotal["backpay"].toFixed(2)});

			var pTotalTR = createHTMLElement("tr", {"parentNode":resultsFoot});
			var pTH = createHTMLElement("th", {"parentNode":pTotalTR, "scope":"row", "nodeText":"Phoenix Total"});
			var preTD = createHTMLElement("td", {"parentNode":pTotalTR, "nodeText":"$" + pTotal["made"].toFixed(2)});
			var preTD = createHTMLElement("td", {"parentNode":pTotalTR, "nodeText":"$" + pTotal["shouldHaveMade"].toFixed(2)});
			var preTD = createHTMLElement("td", {"parentNode":pTotalTR, "nodeText":"$" + pTotal["backpay"].toFixed(2)});

			total["made"] += preTotal["made"] + pTotal["made"];
			total["shouldHaveMade"] += preTotal["shouldHaveMade"] + pTotal["shouldHaveMade"];
			total["backpay"] += preTotal["backpay"] + pTotal["backpay"];
			*/
			var totalTR = createHTMLElement("tr", {"parentNode":resultsFoot});
			var totalTH = createHTMLElement("th", {"parentNode":totalTR, "scope":"row", "nodeText":getStr("total")});
			var preTD = createHTMLElement("td", {"parentNode":totalTR, "nodeText": formatter.format(total["made"])});
			var preTD = createHTMLElement("td", {"parentNode":totalTR, "nodeText": formatter.format(total["shouldHaveMade"])});
			var preTD = createHTMLElement("td", {"parentNode":totalTR, "nodeText": formatter.format(total["backpay"])});
		}
		resultStatus.innerHTML = getStr("resultsShownBelow"); 
	//} else {
		//if (dbug) console.log ("Not the top of your level.  This should be difficult.");
		

	//}
} // End of calculate

function isValidDate (d) {
	let rv = false;
	try {
		if (!typeof(d) == "String") d = d.toString();
		let dateRE = /(\d\d\d\d)-(\d\d)-(\d\d)/;
		let dparts = d.match(dateRE);
		d = new Date(dparts[1], dparts[2]-1, dparts[3]);

		if (d >= TABegin && d<= EndDate) rv = true;
	}
	catch (ex) {
		console.error ("Something went wrong: " + ex.toString());
	}
	return rv;
} // End of isValidDate

function addErrorMessage (inID, errMsg) {
	let el, errDiv = null;
	el = document.getElementById(inID);
	if (el) {
		if (dbug) console.log ("addErrorMessage::value of " + inID + " is " + inID.value + ". Adding errorMessage: " + errMsg + ".");
		errDiv = document.getElementById(inID + "Error");

		if (!errDiv) errDiv = createHTMLElement("div", {"parentNode" : el.parentNode, "id":inID + "Error", "class" : "error"});
		createHTMLElement("p", {"parentNode" : errDiv, "nodeText" : errMsg});
		if (el.hasAttribute("aria-describedby")) {
			el.setAttribute("aria-describedby", el.getAttribute("aria-describedby") + " " + inID + "Error");
		} else {
			el.setAttribute("aria-describedby", inID + "Error");
		}
	} else {
		console.error ("addErrorMessage::Couldn't get element " + inID);
	}
} // End of addErrorMessage

function removeErrorMessage (inID) {
	let inEL, errEl = null;
	inEL = document.getElementById(inID);
	errEL = document.getElementById(inID + "Error");
	if (inEL && errEL) {
		if (inEL.hasAttribute("aria-describedby")) {
			let inELDB = inEL.getAttribute("aria-describedby");
			if (inELDB == inID + "Error") {
				inEL.removeAttribute("aria-describedby");
			} else {
				inELDB = inELDB.replace(inID + "Error", "").trim();
				inEL.setAttribute("aria-describedby", inELDB);
			}
		}
		errEL.parentNode.removeChild(errEl);
	} else {
		if (!(inEL)) console.error ("removeErrorMessage::Couldn't get element " + inID +".");
		if (!(errEL)) console.error ("removeErrorMessage::Couldn't get element " + inID + "Error.");
	}
} // End of removeErrorMessage
	
lang = document.documentElement.lang;
if (lang == "fr") langFormat = "fr-CA";

var formatter = new Intl.NumberFormat(langFormat, {
  style: 'currency',
  currency: 'CAD',

  // These options are needed to round to whole numbers if that's what you want.
  //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  // Taken from https://stackoverflow.com/questions/149055/how-to-format-numbers-as-currency-string
});

function getStr (str) {
	let rv = null;
	
	try {
		rv = i18n[str][lang];

		let repStr = null;
		
		while (repStr = rv.match(/(\{\{(.*?)\}\})/)) {
			if (repStr) {
				if (repStr[2] == "startDate") {
					rv = rv.replace(repStr[1], calcStartDate.getAttribute("datetime"));
				} else if (repStr[2] == "endDate") {
					rv = rv.replace(repStr[1], EndDate.toISOString().substr(0,10));
				}
			}
		}

	}
	catch (ex) {
		console.error ("Error getting Error Message String: " + ex.message + "(" + str + ")");
	}

	return rv;
} // End of getStr

function createHTMLElement (type, attribs) {
	var newEl = document.createElement(type);
	mainForm.appendChild(newEl);
	var dbug = (arguments.length == 3 &&arguments[2] != null && arguments[2] != false ? true : false);
	for (var k in attribs) {
		if (dbug) console.log("Dealing with attrib " + k + ".");
		if (k == "parentNode") {
			if (dbug) console.log("Dealing with parentnode.");
			if (attribs[k] instanceof HTMLElement) {
				if (dbug) console.log("Appending...");
				attribs[k].appendChild(newEl);
			} else if (attribs[k] instanceof String || typeof(attribs[k]) === "string") {
				try {
					if (dbug) console.log("Getting, then appending...");
					document.getElementById(attribs[k]).appendChild(newEl);
				}
				catch (er) {
					console.error("Error creating HTML Element: " + er.message + ".");
				}
			}
		} else if (k == "textNode" || k == "nodeText") {
			if (dbug) console.log("Dealing with textnode " + attribs[k] + ".");
			if (typeof (attribs[k]) == "string") {
				if (dbug) console.log("As string...");
				newEl.appendChild(document.createTextNode(attribs[k]));
			} else if (attribs[k] instanceof HTMLElement) {
				if (dbug) console.log("As HTML element...");
				newEl.appendChild(attribs[k]);
			} else {
				if (dbug) console.log("As something else...");
				newEl.appendChild(document.createTextNode(attribs[k].toString()));
			}
		} else if (k == "innerHTML") {
			if (dbug) console.log ("Dealing with innerHTML " + attribs[k] + ".");
			newEl.innerHTML = attribs[k];
		} else {
			newEl.setAttribute(k, attribs[k]);
		}
	}
	return newEl;
} // End of createHTMLElement
function removeChildren (el) {
	var dbug = (arguments.length == 2 && arguments[1] != null && arguments[1] != false ? true : false);
	while (el.firstChild) {	
		el.removeChild(el.firstChild);
	}
} // End of removeChildren

function getWeekly (an) {
	return (an/wiy);
} // End of getWeekly

function getDaily (an) {
	return ((an/wiy)/5);
} // End of getDaily

function getHourly (an) {
	return (((an/wiy)/5)/7.5);
} // End of getHourly

function genRates () {
	//console.log ("in genRates.");
	// At somet point you're gonna want to incorporate a CPI comparitor.
	// Get the data from: https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401&pickMembers%5B0%5D=1.2&cubeTimeFrame.startMonth=12&cubeTimeFrame.startYear=2021&cubeTimeFrame.endMonth=11&cubeTimeFrame.endYear=2023&referencePeriods=20211201%2C20231101

	newRates["current"] = [];
	for (let it = 0; it < levels; it++) {	// global variable levels
		let lvl = [];
		let newStps = []; //
		for (let stp = 0; stp < salaries[it].length; stp++) {	// steps
			let newStp = {"annual" : salaries[it][stp],
				//"weekly" : getWeekly(salaries[it][stp]),
				"weekly" : weekly[it][stp],
				"daily" : (weekly[it][stp] / 5), //getDaily(salaries[it][stp]),
				"hourly" : ((weekly[it][stp]/5)/7.5) //getHourly(salaries[it][stp])
			};
			//newStps["annual"].push(newStp);
			//console.log ("Pushing " + newStp + " onto newStps[annual].");
			// Do the same for daily, and hourly
			//newStps["weekly"].push(newStp/wiy);
			//newStps["daily"].push((newStp/wiy)/5);
			//newStps["hourly"].push(((newStp/wiy)/5)/7.5);
			lvl.push(newStp);

		}
		//console.log ("newStps has length: " + newStps["annual"].length + ".");
		newRates["current"].push(lvl);

	}

	//console.log ("initPeriods has " + initPeriods.length + " elements.");
	for (let i = 0; i < initPeriods.length; i++) {
		//console.log ("reason: " + initPeriods[i]["reason"]);
		if (initPeriods[i]["reason"] == "Contractual Increase") {
			//console.log ("period: " + i + ":");
			
			let startDate = initPeriods[i]["startDate"];
			let multiplier = ((initPeriods[i]["compound"]/100) +1);
			//console.log ("Multiplier: " + multiplier);

			if (!(newRates.hasOwnProperty(startDate))) newRates[startDate] = [];
			
			//console.log ("newRates[" + startDate + "] has length " + newRates[startDate].length + ".");
			
			//let newLevels = [];
			//console.log ("levels:  " + levels + ".");
			for (let it = 0; it < levels; it++) {	// levels
				let lvl = [];
				if (dbug) console.log ("it: " + it +".");
				
				if (initPeriods[i].hasOwnProperty("exceptions")) {
					for (let k = 0; k < initPeriods[i]["exceptions"].length; k++) {
						if (initPeriods[i]["exceptions"][k]["level"] == (it+1)) {
							//console.log ("Dealing with exception....");
							if (initPeriods[i]["exceptions"][k].hasOwnProperty("compound")) {
								multiplier  = ((initPeriods[i]["exceptions"][k]["compound"]/100) +1);
							}
							//console.log ("multiplier is now: " + multiplier + ".");
						}
					}
				}
				
				//let newStps = {"annual" : [], "weekly" : [], "daily" : [], "hourly" : []};
				let newStps = [];
				for (let stp = 0; stp < salaries[it].length; stp++) {	// steps
					let newSal = salaries[it][stp] * multiplier;
					let newWeekly = weekly[it][stp] * multiplier;

					let newStp = {"annual" : newSal,
						"weekly" : newWeekly, /*getWeekly(newSal),*/
						"daily" : (newWeekly/5),
						"hourly" : ((newWeekly/5) / 7.5)
					}
					//newStps["annual"].push(newStp);
					//console.log ("Pushing " + newStp + " onto newStps[annual].");
					// Do the same for weekly, daily, and hourly
					//newStps["weekly"].push(newStp/wiy);
					//newStps["daily"].push((newStp/wiy)/5);
					//newStps["hourly"].push(((newStp/wiy)/5)/7.5);
					lvl.push(newStp);
				}
				//console.log ("newStps has length: " + newStps["annual"].length + ".");
				newRates[startDate].push(lvl);
				//console.log ("newRates has length: " + newRates[startDate].length + ".");
			}
			//newRates[startDate].push(newLevels);
			//console.log ("Should have a newRates[" + startDate + "] now: " + newRates[startDate].length + ".");
		}
	}
} // End of genRates

function genTables() {
	let payTablesSect = null;
	payTablesSect = document.getElementById("payTablesSect");
	if (!payTablesSect) {
		return;
	} else {
		//console.log ("Did get payTablesSect.");
	}
	
	//console.log ("Got payTablesSect and will now try to create an H3 with text " + getStr("paySectHeading") + ".");
	let payTableH = createHTMLElement("h2", {"parentNode":payTablesSect, "textNode":getStr("paySectHeading")});
	let timeps = ["annual", "weekly", "daily", "hourly"];

	/*
	// Create Filters
	let payTablesFiltersDetails = createHTMLElement("details", {"parentNode":payTablesSect});
	let payTablesFiltersSummary = createHTMLElement("summary", {"parentNode":payTablesFiltersDetails, "textNode":getStr("payTablesFilterLegend")});
	let payTablesFiltersFS = createHTMLElement ("fieldset", {"parentNode":payTablesFiltersDetails, "id" : "payTablesFS"});
	let payTableFiltersLengend = createHTMLElement ("legend", {"parentNode":payTablesFiltersFS, "textNode": getStr("show")});

	for (let i = 0; i<timeps.length; i++) {
		let newDiv = createHTMLElement("div", {"parentNode" : payTablesFiltersFS, "class" : "checkboxHolderDiv"});
		let checkbox = createHTMLElement("input", {"parentNode" : newDiv, "type":"checkbox", "id" : timeps[i] + "Chk", "checked":"checked"});
		let lbl = createHTMLElement("label", { "parentNode":newDiv, "for": timeps[i] + "Chk", "textNode" : getStr(timeps[i])});
	}
	*/
	//console.log ("levels:  " + levels + ".");
	let sects = [];
	for (let i = 0; i<levels; i++) {
		let dl = "-0" + (i+1);
		//let newDiv = createHTMLElement("div", {"parentNode" : payTablesFiltersFS, "class" : "checkboxHolderDiv"});
		//let checkbox = createHTMLElement("input", {"parentNode" : newDiv, "type":"checkbox", "id" : "level" + i + "Chk", "checked":"checked"});
		//let lbl = createHTMLElement("label", { "parentNode":newDiv, "for": timeps[i] + "Chk", "textNode" : getStr(classification) + dl});

		let newSect = createHTMLElement("details", {"parentNode" : payTablesSect, "id" : "payrateSect " + i});
		let newSum = createHTMLElement("summary", {"parentNode": newSect});
		let newSectH = createHTMLElement("h3", {"parentNode":newSum, "textNode" : getStr(classification) + dl});

		// You need a table for each year)
		//console.log ("Periods: " + initPeriods.length + ".");

		let respDiv = createHTMLElement("div" , {"parentNode":newSect, "class": "tables-responsive"});

		let newTable = createHTMLElement("table", {"parentNode"  : respDiv, "class":"table caption-top"});
		let newTableCaption = createHTMLElement("caption", {"parentNode" : newTable, "textNode" : getStr("current")});

		let newTHead = createHTMLElement("thead", {"parentNode" : newTable});
		let newTR = createHTMLElement("tr", {"parentNode" : newTHead});
		let newTD = createHTMLElement("td", {"parentNode" : newTR, "textNode":""});

		for (let stp = 0; stp < newRates["current"][i].length; stp++) {
			let newTH = createHTMLElement("th", {"parentNode" : newTR, "textNode" : getStr("step") + "  " + (stp+1), "scope":"col"});
		}

		let newTBody = createHTMLElement("tbody", {"parentNode" : newTable});
		for (let t = 0; t<timeps.length; t++) {
			let newTR = createHTMLElement("tr", {"parentNode" : newTBody});
			let newTH = createHTMLElement("th", {"parentNode" : newTR, "textNode": getStr(timeps[t]), "scope":"row"});
			for (let stp = 0; stp < newRates["current"][i].length; stp++) {
				let newTD = createHTMLElement("td", {"parentNode" : newTR, "textNode" : formatter.format(newRates["current"][i][stp][timeps[t]])});
			}
		}


		//for (let j = 0; j < initPeriods.length; j++) {
		//console.log ("newRates.length has " + newRates.length + ".");
		//for (let j = 1; j < newRates.length; j++) {
		for (let j in newRates) {
			//console.log ("j: " + j);
			if (j == "current") continue;
			//if (initPeriods[j]["reason"] == "Contractual Increase") {

				let respDiv = createHTMLElement("div" , {"parentNode":newSect, "class": "tables-responsive"});
				let newTable = createHTMLElement("table", {"parentNode" : respDiv, "class":"table caption-top"});
				let newTableCaption = createHTMLElement("caption", {"parentNode" : newTable, "textNode" : j});

				let newTHead = createHTMLElement("thead", {"parentNode" : newTable});
				let newTR = createHTMLElement("tr", {"parentNode" : newTHead});
				let newTD = createHTMLElement("td", {"parentNode" : newTR, "textNode":""});

				//console.log ("initPeriods[j]: " + initPeriods[j]["startDate"] +".");
				for (let stp = 0; stp < newRates[j][i].length; stp++) {
					let newTH = createHTMLElement("th", {"parentNode" : newTR, "textNode" : getStr("step") + "  " + (stp+1), "scope":"col"});
				}

				let newTBody = createHTMLElement("tbody", {"parentNode" : newTable});
				for (let t = 0; t<timeps.length; t++) {
					let newTR = createHTMLElement("tr", {"parentNode" : newTBody});
					let newTH = createHTMLElement("th", {"parentNode" : newTR, "textNode": getStr(timeps[t]), "scope":"row"});
					for (let stp = 0; stp < newRates[j][i].length; stp++) {
						let newTD = createHTMLElement("td", {"parentNode" : newTR, "textNode" : formatter.format(newRates[j][i][stp][timeps[t]])});
					}
				}

		//}
		}
	}

	

} // End of genTables


function getData(classif, caname) {

	if (dbug) console.log ("getData::Getting salaries from classification " + classif + " from CA/TA " + caname + ".");
	salaries = payload[classif][caname]["salaries"]["annual"];
	levels = salaries.length;
	weekly = payload[classification][CAName]["salaries"]["weekly"];
	//daily = json[classification][CAName]["salaries"]["daily"];
	//hourly = json[classification][CAName]["salaries"]["hourly"];
	initPeriods = payload[classification][CAName]["periods"];
	// Now add something for start and end dates

} // End of getData

async function getDataFile () {
	let response = await fetch("raiseInfo.json");
	let success = 0;
	if (response.ok) { // if HTTP-status is 200-299
		// get the response body (the method explained below)
		payload = await response.json();
		if (dbug) console.log ("Got json: "  + JSON.stringify(payload) + ".");
		
		
		success++;
	} else {
		console.error ("HTTP-Error: " + response.status);
	}

	response = await fetch("i18n.json");
	if (response.ok) { // if HTTP-status is 200-299
		i18n = await response.json();
		if (dbug) console.log ("Got json: "  + JSON.stringify(i18n) + ".");
		success++;
	} else {
		console.error ("HTTP-Error: " + response.status);
	}
	if (success==2) {
		if (dbug) console.log ("getDataFile::calling init.");
		init();
	}
} // End of getDataFile

if (dbug) console.log ("Finished loading backpayCalc.js.");
document.addEventListener('DOMContentLoaded', getDataFile, false);

