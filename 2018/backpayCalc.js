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

var dbug = !true;
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
var TABegin = new Date("2018", "11", "22");		// Remember months:  0 == Janaury, 1 == Feb, etc.
var EndDate = new Date("2021", "02", "17");		// This is the day after this should stop calculating; same as endDateTxt.value in the HTML
var day = (1000 * 60 * 60 * 24);
var parts = [];
var resultsBody = null;
var resultsFoot = null;
var resultsTheadTR = null;
var periods = [];
var lumpSumPeriods = {};
var overtimePeriods = {};
var promotions = 0;
var actings = 0;
var lumpSums = 0;
var overtimes = 0;
var lwops = 0;
var lastModified = new Date("2021", "04", "15");
var lastModTime = null;
// taken from http://www.tbs-sct.gc.ca/agreements-conventions/view-visualiser-eng.aspx?id=1#toc377133772
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
//var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
//var days = [31, 29, 31
function init () {
	var calcBtn = document.getElementById("calcBtn");
	levelSel = document.getElementById("levelSelect");
	stepSelect = document.getElementById("stepSelect");
	mainForm = document.getElementById("mainForm");
	resultsDiv = document.getElementById("resultsDiv");
	startDateTxt = document.getElementById("startDateTxt");
	endDateTxt = document.getElementById("endDateTxt");
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

	if (lastModTime) {
		lastModTime.setAttribute("datetime", lastModified.toISOString().substr(0,10));
		lastModTime.innerHTML = lastModified.toLocaleString("en-CA", { year: 'numeric', month: 'long', day: 'numeric' });	
	}

	if (dbug || showExtraCols) {
		var ths = resultsTheadTR.getElementsByTagName("th");
		if (ths.length == 4) {
			createHTMLElement("th", {"parentNode":resultsTheadTR, "scope":"col", "textNode":"Level"});
			createHTMLElement("th", {"parentNode":resultsTheadTR, "scope":"col", "textNode":"Step"});
			createHTMLElement("th", {"parentNode":resultsTheadTR, "scope":"col", "textNode":"There?"});
			createHTMLElement("th", {"parentNode":resultsTheadTR, "scope":"col", "textNode":"Salary"});
			createHTMLElement("th", {"parentNode":resultsTheadTR, "scope":"col", "textNode":"Working Days"});
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
} // End of init

/*
   Populates the Salary Select basedon the CS-0x level selected
*/
function populateSalary () {
	removeChildren(stepSelect);
	if (levelSel.value >0 && levelSel.value <= 5) {
		createHTMLElement("option", {"parentNode":stepSelect, "value":"-1", "textNode":"Select Salary"});
		for (var i = 0; i < salaries[(levelSel.value-1)].length; i++) {
			createHTMLElement("option", {"parentNode":stepSelect, "value":i, "textNode":"$" + salaries[levelSel.value-1][i].toLocaleString()});
		}
	}
	if (startDateTxt.value.replace(/[^-\d]/, "").match(/(\d\d\d\d)-(\d\d)-(\d\d)/)) selectSalary();
} // End of populateSalary

// Once a CS-level and startDate have been selected, select the most likely salary from the dropdown
// Called from init when startDateTxt has changed, and from populateSalary if startDateTxt is a date (####-##-##)

// I don't get it.  What's the difference btween selectSalary and getSalary?
// They both start the same way: get the startDateText date, check for leapyear, set the startDateTxt value, figure out your step, select the step
function selectSalary () {
	//if (!(levelSelect.value > 0 && levelSelect.value <= 5))
	if (parts && levelSel.value >0 && levelSel.value <= 5) {	// if you have a start date, and a CS-0x level
		let startDate = getStartDate();
		startDateTxt.value = startDate.toISOString().substr(0,10)
		let timeDiff = (TABegin - startDate) / day;
		let years = Math.floor(timeDiff/365);

		if (dbug) console.log ("TimeDiff between " + TABegin.toString() + " and " + startDate.toString() + ": "  + timeDiff + ".");

		if (timeDiff < 0) {
			// You started after the CA started
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
	let parts = null;
	startDateTxt.value = startDateTxt.value.replace(/[^-\d]/, "");
	parts = startDateTxt.value.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
	if (dbug) console.log ("Got startDateTxt " + startDateTxt.value + ".");
	if (dbug) console.log ("Got parts " + parts + ".");
	// Leap years
	if (parts[2] == "02" && parts[3] > "28") {
		if (parseInt(parts[1]) % 4 === 0 && parts[3] == "29") {
			// Do nothing right now
		} else {
			parts[3]=(parseInt(parts[1]) % 4 === 0? "29" : "28");
		}
	}
	return new Date(parts[1], parts[2]-1, parts[3]);

} // End of getStartDate

function startProcess () {
	periods = initPeriods();
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

	var errorDivs = document.querySelectorAll(".error");
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

	calculate();

} // End of startProcess

function initPeriods () {
	return ([
		{startDate : "2018-12-22", "increase":2.816, "reason":"Contractual Increase", "multiplier" : 1},
		{startDate : "2019-04-01", "increase":0.00, "reason":"Fiscal New Year", "multiplier" : 1},
		{startDate : "2019-12-22", "increase":2.204, "reason":"Contractual Increase", "multiplier" : 1}, 
		{startDate : "2020-04-01", "increase":0.00, "reason":"Fiscal New Year", "multiplier" : 1},
		{startDate : "2020-12-22", "increase":1.50, "reason":"Contractual Increase", "multiplier" : 1},
		{startDate : "2021-02-26", "increase":0.00, "reason":"Contract Signed", "multiplier" : 1}
	]);
} // End of initPeriods

// getSalary called during startProcess.  "guess" isn't really a good word for this, so I changed it to "get"

// I don't get it.  What's the difference btween selectSalary and getSalary?
// This ones starts: get the CS-0level, get the startDateText date, check for leapyear, set the startDateTxt value, figure out your step, select the step
function getSalary () {
	var levelSelect = document.getElementById("levelSelect");
	var lvl = levelSelect.value.replace(/\D/, "");
	if (dbug) console.log ("Got level " + lvl + "."); // and start date of " + startDate + ".");
	if (lvl < 1 || lvl > 5) {	// Should only happen if someone messes with the querystring
		if (dbug) console.log ("getSalary::Error:  lvl is -1.");
		var errDiv = createHTMLElement("div", {"parentNode":levelSelect.parentNode, "id":"levelSelectError", "class":"error"});
		createHTMLElement("span", {"parentNode":errDiv, "nodeText":"Please select a level"});
		levelSelect.setAttribute("aria-describedby", "levelSelectError");
		levelSelect.focus();
		//return;
	}
	level = ((lvl > 0 && lvl < salaries.length+1) ? lvl : null);

	let startDate = getStartDate();
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

		let parts = null;
		parts = endDateTxt.value.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
		if (parts) {
			EndDate = new Date(parts[1], (parts[2]-1), parts[3]);
			EndDate.setDate(EndDate.getDate() + parseInt(1));
			if (dbug) console.log ("getSalary::Got EndDateTxt as " + endDateTxt.value + ".");
			//if (dbug) console.log ("Got EndDate as " + EndDate.toISOString().substr(0, 10) + ".");
		}
		//This used to be below adding anniversaries, but some anniversaries were being missed
		if (dbug) console.log ("getSalary::About to set EndDate to " + EndDate.toISOString().substr(0, 10) + ".");
		addPeriod ({"startDate" : EndDate.toISOString().substr(0, 10), "increase":0, "reason":"end", "multiplier" : 1});

		//add anniversarys
		//dbug = true;
		let startYear = Math.max(2018, startDate.getFullYear());
		if (dbug) console.log ("getSalary::Going to set anniversary dates betwixt: " + startYear + " and " + EndDate.getFullYear() + ".");
		for (var i = startYear; i <=EndDate.getFullYear(); i++) {
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
			for (var i = 0; i < periods.length; i++) {
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
			for (var i = 0; i < periods.length; i++) {
				console.log ("getSalary::" + periods[i]["reason"] + ": " + periods[i]["startDate"] + ".");
			}
		}

	} else {
		if (dbug) console.log ("getSalary::Something's not valid.  Lvl: " + level + ", startDate: " + startDate + ".");
		addStartDateErrorMessage();
	}
} // End of getSalary

function addPromotions () {
	// Add promotions
	var promotions = document.querySelectorAll(".promotions");
	var numOfPromotions = promotions.length;
	if (dbug) console.log("addPromotions::Checking for " + numOfPromotions + " promotions.");
	for (var i = 0; i < promotions.length; i++) {
		var promoLevel = promotions[i].getElementsByTagName("select")[0].value;
		if (dbug) console.log("addPromotions::promoLevel " + i + ": " + promoLevel + ".");
		var promoDate  = promotions[i].getElementsByTagName("input")[0].value.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
		if (dbug) console.log("addPromotions::promoDate " + i + ": " + promoDate[0] + ".");
		if (promoDate) {
			if (promoDate[0] > TABegin.toISOString().substr(0,10) && promoDate[0] < EndDate.toISOString().substr(0, 10) && promoLevel > 0 && promoLevel <=5) {
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

			} else {
				if (dbug) {
					if (promoDate[0] > TABegin.toISOString().substr(0,10)) console.log ("addPromotions::It's after the beginning.");
					if (promoDate[0] < EndDate.toISOString().substr(0, 10)) console.log ("addPromotions::It's before the end.");
					if (promoLevel > 0) console.log ("addPromotions::It's greater than 0.");
					if (promoLevel < 5) console.log ("addPromotions::It's less than or equal to 5.");
				}
			}
		} else {
			if (dbug) console.log("addPromotions::Didn't get promoDate.");
		}
	}
} // End of addPromotions

function getActings () {
	// Add actings
	var actingStints = document.querySelectorAll(".actingStints");
	if (dbug) console.log ("getActings::Dealing with " + actingStints.length + " acting stints.");

	for (var i =0; i < actings; i++) {
		var actingLvl = actingStints[i].getElementsByTagName("select")[0].value;
		var dates = actingStints[i].getElementsByTagName("input");
		var actingFromDate = dates[0].value;
		var actingToDate = dates[1].value;
		if (dbug) console.log("getActings::Checking acting at " + actingLvl + " from " + actingFromDate + " to " + actingToDate + ".");
		if (actingLvl >=0 && actingLvl <5 && actingFromDate.match(/\d\d\d\d-\d\d-\d\d/) && actingToDate.match(/\d\d\d\d-\d\d-\d\d/)) {
			if (dbug) console.log ("getActings::Passed the initial tests.");
			if (actingFromDate <= EndDate.toISOString().substr(0, 10) && actingToDate >= TABegin.toISOString().substr(0,10) && actingToDate > actingFromDate) {
				if (actingFromDate < TABegin.toISOString().substr(0,10) && actingToDate >= TABegin.toISOString().substr(0,10)) actingFromDate = TABegin.toISOString().substr(0,10);
				if (dbug) console.log ("getActings::And the dates are in the right range.");
				// add a period for starting
				var from = addPeriod({"startDate":actingFromDate, "increase":0, "reason":"Acting Start", "multiplier":1, "level":(actingLvl-1)});

				// add a period for returning
				var toParts = actingToDate.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
				actingToDate = new Date(toParts[1], (toParts[2]-1), toParts[3]);
				actingToDate.setDate(actingToDate.getDate() + parseInt(1));
				var to = addPeriod({"startDate":actingToDate.toISOString().substr(0, 10), "increase":0, "reason":"Acting Finished", "multiplier":1});
				var fromParts = actingFromDate.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
				actingFromDate = new Date(fromParts[1], (fromParts[2]-1), fromParts[3]);
				
				for (var j = parseInt(fromParts[1])+1; j < toParts[1]; j++) {
					if (j + "-" + fromParts[2] + "-" + fromParts[3] < actingToDate.toISOString().substr(0, 10)) {
						addPeriod({"startDate":j + "-" + fromParts[2] + "-" + fromParts[3], "increase":0, "reason":"Acting Anniversary", "multiplier":1});
					}
				}
			} else {
				if (dbug) {
					if (actingFromDate <= EndDate.toISOString().substr(0, 10)) console.log ("getActings::actingFrom is before EndDate");
					if (actingToDate >= TABegin.toISOString().substr(0,10)) console.log ("getActings::actingTo is after startDate");
					if (actingToDate <= EndDate.toISOString().substr(0, 10)) console.log ("getActings::actingTo is before EndDate");
					if (actingToDate > actingFromDate) console.log ("getActings::actingTo is after actingFrom");
				}
			}
		} else {
			if (dbug) {
				if (actingLvl >=0) console.log ("getActings::actingLvl >= 0");
				if (actingLvl <5) console.log ("getActings::actingLvl < 5");
				if (actingFromDate.match(/\d\d\d\d-\d\d-\d\d/)) console.log ("getActings::actingFrom is right format.");
				if (actingToDate.match(/\d\d\d\d-\d\d-\d\d/)) console.log ("getActings::actingTo is right format.");
			}
		}
	}
} // End of getActings

function getLWoPs () {
	// Add lwops
	var lwopStints = document.querySelectorAll(".lwopStints");
	if (dbug) console.log ("Dealing with " + lwopStints.length + " lwops.");
	
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
				//var fromParts = lwopFromDate.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
				//lwopFromDate = new Date(fromParts[1], (fromParts[2]-1), fromParts[3]);
			} else {
				if (dbug) {
					if (lwopFromDate <= EndDate.toISOString().substr(0, 10)) console.log ("lwopFrom is before EndDate");
					if (lwopToDate >= TABegin.toISOString().substr(0,10)) console.log ("lwopTo is after startDate");
					if (lwopToDate > lwopFromDate) console.log ("lwopTo is after lwopFrom");
				}
			}
		} else {
			if (dbug) {
				if (lwopLvl >=0) console.log ("getLWoPs::lwopLvl >= 0");
				if (lwopLvl <5) console.log ("getLWoPs::lwopLvl < 5");
				if (lwopFromDate.match(/\d\d\d\d-\d\d-\d\d/)) console.log ("getLWoPs::lwopFrom is right format.");
				if (lwopToDate.match(/\d\d\d\d-\d\d-\d\d/)) console.log ("getLWoPs::lwopTo is right format.");
			}
		}
	}
} // End of getLWoPs
	
function getOvertimes () {
	// Add Overtimes
	var overtimeStints = document.querySelectorAll(".overtimes");
	if (dbug) console.log ("overtimes::Dealing with " + overtimeStints.length + " overtimes.");
	
	for (var i =0; i < overtimeStints.length; i++) {
		var overtimeDate = overtimeStints[i].querySelector("input[type=date]").value;
		var overtimeAmount = overtimeStints[i].querySelector("input[type=text]").value.replace(/[^\d\.]/, "");
		var overtimeRate = overtimeStints[i].querySelector("select").value;
		if (overtimeDate.match(/\d\d\d\d-\d\d-\d\d/)) {
			if (dbug) console.log ("Passed the initial tests.");
			if (overtimeDate >= TABegin.toISOString().substr(0,10) && overtimeDate <= EndDate.toISOString().substr(0, 10) && overtimeAmount > 0) {
				if (dbug) console.log ("overtimes::And the dates are in the right range.");
				// add a period for starting
				
				var from = addPeriod({"startDate":overtimeDate, "increase":0, "reason":"Overtime", "multiplier":0, "hours":overtimeAmount, "rate":overtimeRate});
				
			} else {
				if (dbug) {
					if (overtimeDate >= TABegin.toISOString().substr(0,10)) console.log ("overtimeDate is after startDate");
					if (overtimeDate <= EndDate.toISOString().substr(0, 10)) console.log ("overtimeDate is before EndDate");
					if (overtimeAmount > 0) console.log ("overtimeAmount > 0");
				}
			}
		} else {
			if (dbug) {
				if (overtimeDate.match(/\d\d\d\d-\d\d-\d\d/)) console.log ("overtimeDate is right format.");
			}
		}
	}
} // End of getOvertimes

function getLumpSums () {
	// Add LumpSums
	var lumpsums = document.querySelectorAll(".lumpSums");
	if (dbug) console.log ("Dealing with " + lumpsums.length + " lumpsums.");
	
	for (var i =0; i < lumpsums.length; i++) {
		var lumpSumDate = lumpsums[i].querySelector("input[type=date]").value;
		var lumpSumAmount = lumpsums[i].querySelector("input[type=text]").value.replace(/[^\d\.]/, "");
		if (lumpSumDate.match(/\d\d\d\d-\d\d-\d\d/)) {
			if (dbug) console.log ("Passed the initial tests.");
			if (lumpSumDate >= TABegin.toISOString().substr(0,10) && lumpSumDate <= EndDate.toISOString().substr(0, 10) && lumpSumAmount > 0) {
				if (dbug) console.log ("And the dates are in the right range.");
				// add a period for starting
				var from = addPeriod({"startDate":lumpSumDate, "increase":0, "reason":"Lump Sum", "multiplier":0, "hours":lumpSumAmount});
				
			} else {
				if (dbug) {
					if (lumpSumDate >= TABegin.toISOString().substr(0,10)) console.log ("lumpSumDate is after startDate");
					if (lumpSumDate <= EndDate.toISOString().substr(0, 10)) console.log ("lumpSumDate is before EndDate");
					if (lumpSumAmount > 0) console.log ("lumpSumAmount > 0");
				}
			}
		} else {
			if (dbug) {
				if (lumpSumDate.match(/\d\d\d\d-\d\d-\d\d/)) console.log ("lumpSumDate is right format.");
			}
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
				var newPromoLbl = createHTMLElement("label", {"parentNode":newPromotionDiv, "for":"promoDate" + i, "nodeText":"Date of promotion: "});
				var newPromoDate = createHTMLElement("input", {"parentNode":newPromotionDiv, "type":"date", "id":"promoDate" + i, "aria-describedby":"dateFormat"});
	
				var newLevelLbl = createHTMLElement("label", {"parentNode":newPromotionDiv, "for":"promoLevel" + i, "nodeText":"Level promotion: "});
				var newPromoSel = createHTMLElement("select", {"parentNode":newPromotionDiv, "id":"promoLevel" + i});
				for (var j = 0; j < 6; j++) {
					var newPromoOpt = createHTMLElement("option", {"parentNode":newPromoSel, "value": j, "nodeText":(j == 0 ? "Select Level" : "CS-0" + j)});
				}
			}
		}
	}
	resultStatus.innerHTML="New promotions section added.";
} // End of handlePromotions
*/

function addPromotionHandler () {
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

	let newPromotionFS = createHTMLElement("fieldset", {"parentNode":promotionsDiv, "class":"fieldHolder promotions", "id" :"promo" + id});
	let newPromotionLegend = createHTMLElement("legend", {"parentNode":newPromotionFS, "textNode":"Promotion"});

	var newPromoLbl = createHTMLElement("label", {"parentNode":newPromotionFS, "for":"promoDate" + id, "nodeText":"Date of promotion: "});
	var newPromoDate = createHTMLElement("input", {"parentNode":newPromotionFS, "type":"date", "id":"promoDate" + id, "aria-describedby":"dateFormat"});

	let newLevelLbl = createHTMLElement("label", {"parentNode":newPromotionFS, "for":"promotionLevel" + id, "nodeText":"Promoted to level: "});
	var newPromotionSel = createHTMLElement("select", {"parentNode":newPromotionFS, "id":"actingLevel" + id});
	for (var j = 0; j < 6; j++) {
		var newPromoOpt = createHTMLElement("option", {"parentNode":newPromotionSel, "value": j, "nodeText":(j == 0 ? "Select Level" : "CS-0" + j)});
		if (parseInt(levelSel.value)+1 == j) newPromoOpt.setAttribute("selected", "selected");
	}


	var br = createHTMLElement("br", {"parentNode":newPromotionFS});

	var newDelPromotionBtn = createHTMLElement("input", {"parentNode":newPromotionFS, "type":"button", "value":"Remove", "id": "removePromotionBtn" + promotions});
	var newAddPromotionBtn = createHTMLElement("input", {"parentNode":newPromotionFS, "type":"button", "value":"Add another promotion", "class":"promotionsBtn", "id": "addPromotionsBtn" + id});
	newAddPromotionBtn.addEventListener("click", addPromotionHandler, false);
	newDelPromotionBtn.addEventListener("click", removePromotionDiv, false);

	promotions++;


	resultStatus.innerHTML="New Acting section added.";
} // End of addPromotionHandler

function addActingHandler () {
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

	var newActingFS = createHTMLElement("fieldset", {"parentNode":actingsDiv, "class":"fieldHolder actingStints"});
	var newActingLegend = createHTMLElement("legend", {"parentNode":newActingFS, "textNode":"Acting Stint"});

	var newLevelLbl = createHTMLElement("label", {"parentNode":newActingFS, "for":"actingLevel" + id, "nodeText":"Acting Level: "});
	var newActingSel = createHTMLElement("select", {"parentNode":newActingFS, "id":"actingLevel" + id});
	for (var j = 0; j < 6; j++) {
		var newPromoOpt = createHTMLElement("option", {"parentNode":newActingSel, "value": j, "nodeText":(j == 0 ? "Select Level" : "CS-0" + j)});
		if (parseInt(levelSel.value)+1 == j) newPromoOpt.setAttribute("selected", "selected");
	}
	var newActingFromLbl = createHTMLElement("label", {"parentNode":newActingFS, "textNode":"From", "for":"actingFrom" + id});
	var newActingFromDate = createHTMLElement("input", {"parentNode":newActingFS, "id":"actingFrom"+id, "type":"date", "aria-describedby":"dateFormat"});
	var newActingToLbl = createHTMLElement("label", {"parentNode":newActingFS, "textNode":"To", "for":"actingTo"+id});
	var newActingFromDate = createHTMLElement("input", {"parentNode":newActingFS, "id":"actingTo"+id, "type":"date", "aria-describedby":"dateFormat"});
	var br = createHTMLElement("br", {"parentNode":newActingFS});

	var newDelActingBtn = createHTMLElement("input", {"parentNode":newActingFS, "type":"button", "value":"Remove", "id": "removeActingBtn" + id});
	var newAddActingBtn = createHTMLElement("input", {"parentNode":newActingFS, "type":"button", "value":"Add another acting period", "class":"actingBtn", "id":"addActingsBtn" + id});
	newAddActingBtn.addEventListener("click", addActingHandler, false);
	newDelActingBtn.addEventListener("click", removeActingDiv, false);

	actings++;
	resultStatus.innerHTML="New Acting section added.";
} // End of addActingHandler

function addLWoPHandler () {
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

	var newLWoPFS = createHTMLElement("fieldset", {"parentNode":LWoPDiv, "class":"fieldHolder lwopStints"});
	var newLWoPLegend = createHTMLElement("legend", {"parentNode":newLWoPFS, "textNode":"LWoP Stint"});

	var newLWoPFromLbl = createHTMLElement("label", {"parentNode":newLWoPFS, "textNode":"From", "for":"lwopFrom" + id});
	var newLWoPFromDate = createHTMLElement("input", {"parentNode":newLWoPFS, "id":"lwopFrom"+id, "type":"date", "aria-describedby":"dateFormat"});
	var newLWoPToLbl = createHTMLElement("label", {"parentNode":newLWoPFS, "textNode":"To", "for":"lwopTo"+id});
	var newLWoPFromDate = createHTMLElement("input", {"parentNode":newLWoPFS, "id":"lwopTo"+id, "type":"date", "aria-describedby":"dateFormat"});
	var br = createHTMLElement("br", {"parentNode":newLWoPFS});

	var newDelLWoPBtn = createHTMLElement("input", {"parentNode":newLWoPFS, "type":"button", "value":"Remove", "id": "removeLwopBtn" + id});
	var newAddLWoPBtn = createHTMLElement("input", {"parentNode":newLWoPFS, "type":"button", "value":"Add another lwop period", "class":"lwopBtn", "id":"addLwopsBtn" + id});
	newAddLWoPBtn.addEventListener("click", addLWoPHandler, false);
	newDelLWoPBtn.addEventListener("click", removeLWoPDiv, false);

	lwops++;
	resultStatus.innerHTML="New leave without pay section added.";
} // End of lWoPHandler

function addOvertimeHandler () {
	var OvertimeDiv = document.getElementById("overtimeDiv");

	var id = overtimes;
	var looking = true;
	while (looking) {
		if (document.getElementById("overtimeDate" + id)) {
			id++;
		} else {
			looking = false;
		}
	}
	var newOvertimeFS = createHTMLElement("fieldset", {"parentNode":OvertimeDiv, "class":"fieldHolder overtimes"});
	var newOvertimeLegend = createHTMLElement("legend", {"parentNode":newOvertimeFS, "textNode":"Overtime or Standby"});

	var newDateFieldHolder = createHTMLElement("div", {"parentNode":newOvertimeFS, "class":"fieldHolder"});
	var newOvertimeDateLbl = createHTMLElement("label", {"parentNode":newDateFieldHolder, "textNode":"Date of Overtime:", "for":"overtimeDate" + id});
	var newOvertimeDate = createHTMLElement("input", {"parentNode":newDateFieldHolder, "id":"overtimeDate"+id, "type":"date", "aria-describedby":"dateFormat"});

	var newAmountFieldHolder = createHTMLElement("div", {"parentNode":newOvertimeFS, "class":"fieldHolder"});
	var newOvertimeAmountLbl = createHTMLElement("label", {"parentNode":newAmountFieldHolder, "textNode":"Hours-worth of overtime", "for":"overtimeAmount" + id});
	var newOvertimeAmount = createHTMLElement("input", {"parentNode":newAmountFieldHolder, "id":"overtimeAmount"+id, "type":"text"});

	var newRateFieldHolder = createHTMLElement("div", {"parentNode":newOvertimeFS, "class":"fieldHolder"});
	var newOvertimeRateLbl = createHTMLElement("label", {"parentNode":newAmountFieldHolder, "textNode":"Overtime Rate:", "for":"overtimeRate" + id});
	var newOvertimeRate = createHTMLElement("select", {"parentNode":newAmountFieldHolder, "id":"overtimeRate"+id});
	createHTMLElement("option", {"parentNode":newOvertimeRate, "value":"0", "nodeText":"Select Overtime Rate"});
	createHTMLElement("option", {"parentNode":newOvertimeRate, "value":"0.125", "nodeText":"1/8x - Standby", "selected":"selected"});
	createHTMLElement("option", {"parentNode":newOvertimeRate, "value":"1.0", "nodeText":"1.0x", "selected":"selected"});
	createHTMLElement("option", {"parentNode":newOvertimeRate, "value":"1.5", "nodeText":"1.5x", "selected":"selected"});
	createHTMLElement("option", {"parentNode":newOvertimeRate, "value":"2.0", "nodeText":"2.0x"});

	var newDelOvertimeBtn = createHTMLElement("input", {"parentNode":newOvertimeFS, "type":"button", "value":"Remove", "id": "removeOvertimeBtn" + id});
	var newAddOvertimeBtn = createHTMLElement("input", {"parentNode":newOvertimeFS, "type":"button", "value":"Add another Overtime or Standby period", "class":"overtimeBtn", "id":"addOvertimesBtn" + id});
	newAddOvertimeBtn.addEventListener("click", addOvertimeHandler, false);
	newDelOvertimeBtn.addEventListener("click", removeOvertimeDiv, false);

	overtimes++;
	resultStatus.innerHTML="New overtime section added.";
} // End of addOvertimeHandler

function addLumpSumHandler () {
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
	var newLumpSumFS = createHTMLElement("fieldset", {"parentNode":LumpSumDiv, "class":"fieldHolder lumpSums"});
	var newLumpSumLegend = createHTMLElement("legend", {"parentNode":newLumpSumFS, "textNode":"Lump Sums"});

	var newDateFieldHolder = createHTMLElement("div", {"parentNode":newLumpSumFS, "class":"fieldHolder"});
	var newLumpSumDateLbl = createHTMLElement("label", {"parentNode":newDateFieldHolder, "textNode":"Date paid out:", "for":"lumpSumDate" + id});
	var newLumpSumDate = createHTMLElement("input", {"parentNode":newDateFieldHolder, "id":"lumpSumDate"+id, "type":"date", "aria-describedby":"dateFormat"});

	var newAmountFieldHolder = createHTMLElement("div", {"parentNode":newLumpSumFS, "class":"fieldHolder"});
	var newLumpSumAmountLbl = createHTMLElement("label", {"parentNode":newAmountFieldHolder, "textNode":"Hours-worth of payout", "for":"lumpSumAmount" + id});
	var newLumpSumAmount = createHTMLElement("input", {"parentNode":newAmountFieldHolder, "id":"lumpSumAmount"+id, "type":"text"});

	var newDelLumpSumBtn = createHTMLElement("input", {"parentNode":newLumpSumFS, "type":"button", "value":"Remove", "id": "removeLumpSumBtn" + id});
	var newAddLumpSumBtn = createHTMLElement("input", {"parentNode":newLumpSumFS, "type":"button", "value":"Add another Lump Sum period", "class":"lumpsumBtn", "id":"addLumpSumsBtn" + id});
	newAddLumpSumBtn.addEventListener("click", addLumpSumHandler, false);
	newDelLumpSumBtn.addEventListener("click", removeLumpSumDiv, false);

	lumpSums++;
	resultStatus.innerHTML="New lump sum section added.";
} // End of addLumpSum Handler

function removePromotionDiv (e) {
	var btn= e.target;
	var btnID = btn.getAttribute("id")
	btnID = btnID.replaceAll(/\D/g, "");
	if (btnID > 0) btnID--;
	var fs = btn.parentNode;
	fs.parentNode.removeChild(fs);
	promotions--;
	if (promotions == 0 || btnID < 0) {
		addPromotionBtn.focus();
	} else {
		let promotionBtns = null;
		promotionBtns = document.getElementById("addPromotionsBtn" + btnID);
		if (!promotionBtns) {
			for (var j = btnID; promotionBtns === null && j >0; j--) {
				promotionBtns = document.getElementById("addPromotionsBtn" + j);
			}
			if (j == 0) promotionBtns = addPromotionBtn;
		}
		try {
			promotionBtns.focus();
		}
		catch (ex) {
			console.error ("Exception: " + ex.toString());
			addPromotionBtn.focus();
		}
	}
	resultStatus.innerHTML="Promotion section removed.";
}

function removeActingDiv (e) {
	var btn= e.target;
	var btnID = btn.getAttribute("id")
	btnID = btnID.replaceAll(/\D/g, "");
	if (btnID > 0) btnID--;
	var fs = btn.parentNode;
	fs.parentNode.removeChild(fs);
	actings--;
	if (actings == 0 || btnID < 0) {
		addActingBtn.focus();
	} else {
		let actingBtns = null;
		actingBtns = document.getElementById("addActingsBtn" + btnID);
		if (!actingBtns) {
			for (var j = btnID; actingBtns === null && j >0; j--) {
				actingBtns = document.getElementById("addActingsBtn" + j);
			}
			if (j == 0) actingBtns = addActingBtn;
		}
		

		try {
			actingBtns.focus();
		}
		catch (ex) {
			console.error ("Exception: " + ex.toString());
			addActingBtn.focus();
		}
	}
	resultStatus.innerHTML="Acting section removed.";
}
function removeLWoPDiv (e) {
	var btn= e.target;
	var btnID = btn.getAttribute("id")
	btnID = btnID.replaceAll(/\D/g, "");
	if (btnID > 0) btnID--;
	var fs = btn.parentNode;
	fs.parentNode.removeChild(fs);
	lwops--;
	if (lwops == 0 || btnID < 0) {
		addLwopBtn.focus();
	} else {
		let lwopBtns = null;
		lwopBtns = document.getElementById("addLwopsBtn" + btnID);
		if (!lwopBtns) {
			for (var j = btnID; lwopBtns === null && j >0; j--) {
				lwopBtns = document.getElementById("addLwopsBtn" + j);
			}
			if (j == 0) lwopBtns = addLwopBtn;
		}
		

		try {
			lwopBtns.focus();
		}
		catch (ex) {
			console.error ("Exception: " + ex.toString());
			addLwopBtn.focus();
		}
	}
	resultStatus.innerHTML="Leave Without Pay section removed.";
}
function removeLumpSumDiv (e) {
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
	resultStatus.innerHTML="Lump sum section removed.";
}

function removeOvertimeDiv (e) {
	var btn= e.target;
	var btnID = btn.getAttribute("id")
	btnID = btnID.replaceAll(/\D/g, "");
	if (btnID > 0) btnID--;
	var fs = btn.parentNode;
	fs.parentNode.removeChild(fs);
	overtimes--;
	if (overtimes == 0 || btnID < 0) {
		addOvertimeBtn.focus();
	} else {
		let overtimeBtns = null;
		overtimeBtns = document.getElementById("addOvertimesBtn" + btnID);
		if (!overtimeBtns) {
			for (var j = btnID; overtimeBtns === null && j >0; j--) {
				overtimeBtns = document.getElementById("addOvertimesBtn" + j);
			}
			if (j == 0) overtimeBtns = addOvertimeBtn;
		}
		

		try {
			overtimeBtns.focus();
		}
		catch (ex) {
			console.error ("Exception: " + ex.toString());
			addOvertimeBtn.focus();
		}
	}
	resultStatus.innerHTML="Overtime section removed.";
}
function addPeriod (p) {
	var rv = null;
	if (dbug) console.log ("addPeriod::Gonna add period beginnging at " + p["startDate"] + " to periods (" + periods.length + ").");
	if (p["reason"] == "end") periods.push(p);
	if (p.startDate < periods[0]["startDate"]) return;
	var looking = true;
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
	for (var i = 1; i < periods.length && looking; i++) {
		//if (/*p["reason"] == "Anniversary Increase" && */dbug) console.log ("addPeriod::["+i+"]Is p[startDate](" + p["startDate"] + ") before periods["+i+"][startDate](" + periods[i]["startDate"] + ")?");
		if (p["startDate"] < periods[i]["startDate"]) {
			if (/*p["reason"] == "Anniversary Increase" && */dbug) console.log ("addPeriod::["+i+"]It is!");
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
				if (p["reason"] == "Anniversary Increase" && dbug) console.log ("addPeriod::Adding anniversary increase.");
				periods.splice(i, 0, p);
				rv = i;
				looking = false;
				if (p["reason"]=="end") {
					periods.splice(i+1); 
					rv = periods.length-1;
				}
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
		if (dbug) console.log ("\n\nCalculating:  There are " + periods.length + " periods to be concerned with.");
		
		var actingStack = [];
		var multiplier = 1;
		var newSalaries = JSON.parse(JSON.stringify(salaries));
		var newDaily = JSON.parse(JSON.stringify(daily));
		var newHourly = JSON.parse(JSON.stringify(hourly));
		var preTotal = {"made":0, "shouldHaveMade":0, "backpay":0};
		var pTotal = {"made":0, "shouldHaveMade":0, "backpay":0};
		var total = {"made":0, "shouldHaveMade":0, "backpay":0};
		if (dbug) {
			console.log("prelim checks:");
			for (var i = 0; i < periods.length; i++) {
				console.log (periods[i]["reason"] + ": " + periods[i]["startDate"] + ".");
			}
		}
		for (var i = 0; i < periods.length-1; i++) {
			if (dbug) console.log(i + ": " + periods[i]["startDate"] + ":");
			if (dbug) console.log (i + ": going between " + periods[i]["startDate"] + " and " + periods[i+1]["startDate"] + " for the reason of " + periods[i]["reason"] + ".");
			if (periods[i]["reason"].match(/Anniversary Increase/)) {
				var output = "";
				if (actingStack.length == 0) {
					if (i ==0) {
						output += "Not increasing step because this is the first anniversary, and your anniversary is on this date.";
					} else {
						output += "Increasing step from " + step + " to ";
						step = Math.min(parseInt(step) + 1, salaries[level].length-1);
						output += step + ".";
					}
				} else {
					output += "Increasing non-acting step from " + actingStack[0]["step"] + " to ";
					actingStack[0]["step"] = Math.min(parseInt(actingStack[0]["step"]) +1, salaries[actingStack[0]["level"]].length-1);
					output += actingStack[0]["step"] + ".";
				}
				if (dbug) console.log (output);
			} else if (periods[i]["reason"] == "Acting Anniversary") {
				var output = "Increasing step from " + step + " to ";
				step = Math.min(step + 1, salaries[level].length-1);
				output += step + "."
				if (dbug) console.log (output);
			} else if (periods[i]["reason"] == "promotion") {
				var currentSal = salaries[level][step];
				var minNewSal = currentSal * 1.04;
				level = periods[i]["level"];
				var looking = true;
				for (var stp = 0; stp < salaries[level].length && looking; stp++) {
					if (salaries[level][stp] > minNewSal) {
						step = stp;
						looking = false;
					}
				}
			} else if (periods[i]["reason"] == "Acting Start") {
				actingStack.push({"level":level, "step":step});
				var currentSal = salaries[level][step];
				var minNewSal = currentSal * 1.04;
				level = periods[i]["level"];
				var looking = true;
				for (var stp = 0; stp < salaries[level].length && looking; stp++) {
					if (salaries[level][stp] > minNewSal) {
						step = stp;
						looking = false;
					}
				}

			} else if (periods[i]["reason"] == "Acting Finished") {
				var orig = actingStack.pop();
				step = orig["step"];
				level = orig["level"];
			}
			periods[i]["made"] = 0;
			periods[i]["shouldHaveMade"] = 0;
			periods[i]["backpay"] = 0;
			multiplier =(1 + (periods[i]["increase"]/100));
			if (dbug) console.log ("Multiplier: " + multiplier + ".");
			if (periods[i]["increase"] > 0) {
				// Calculate new salaries, dailys, and hourlys
				for (var l = 0; l < newSalaries.length; l++) {
					for (var s = 0; s < newSalaries[l].length; s++) {
						if (dbug && l == level) console.log ("Multiplying " + newSalaries[l][s] + " * " + multiplier + ".");
						newSalaries[l][s] = (newSalaries[l][s] * multiplier).toFixed(2);
						newDaily[l][s] = (newSalaries[l][s] / 260.88); //.toFixed(2);
						newHourly[l][s] = (newSalaries[l][s] / 1956.6); //.toFixed(2);
						if (dbug && l == level) console.log ("And it came to " + newSalaries[l][s] + ".");
					}
				}
				if (dbug) console.log ("Your annual salary went from " + salaries[level][step] + " to " + newSalaries[level][step] + ".");
			}
			var days = 0;
			if (step >= 0) {
				var parts = periods[i]["startDate"].match(/(\d\d\d\d)-(\d\d?)-(\d\d?)/);
				var current = new Date(parts[1], parts[2]-1, parts[3]);
				parts = periods[i+1]["startDate"].match(/(\d\d\d\d)-(\d\d?)-(\d\d?)/);
				var future = new Date(parts[1], parts[2]-1, parts[3]);
				//future.setDate(future.getDate() - 1);
				var diff = (future  - current) / day;
				if (dbug) console.log ("There were " + diff + " days between " + current.getFullYear() + "-" +  (current.getMonth()+1) +"-" + current.getDate() + " and " + future.getFullYear() + "-" + (future.getMonth()+1) + "-" + future.getDate() +".");
				while (current < future) {
					//if (dbug) console.log ("Now calculating for day " + current.toString() + ".");
					if (current.getDay() > 0 && current.getDay() < 6) {	// don't calculate weekends
						days++;
						periods[i]["made"] = periods[i]["made"] + daily[level][step] * periods[i]["multiplier"];	// multiplier is if you were there then or not.
						periods[i]["shouldHaveMade"] = (periods[i]["shouldHaveMade"] + (newDaily[level][step] * periods[i]["multiplier"]));
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
			var reasonDiv = createHTMLElement("div", {"parentNode":newPaidTD, "textNode":"(" + periods[i]["reason"] + ")", "class":"small"});
			var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(periods[i]["made"])}); //.toFixed(2)});
			var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(periods[i]["shouldHaveMade"])}); //.toFixed(2)});
			var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(periods[i]["backpay"])}); //.toFixed(2)});

			if (dbug || showExtraCols) {
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "CS-0" + (level +1)});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": (Math.max(1, (parseInt(step)+1)))});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": (periods[i]["multiplier"] ? "Yes" : "No")});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": (step >=0 ? (daily[level][step] * periods[i]["multiplier"]).toFixed(2) + " -> " + (newDaily[level][step] * periods[i]["multiplier"]).toFixed(2) : "0") + " / day"});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": days});
			}
			
			if (overtimePeriods.hasOwnProperty(periods[i]["startDate"])) {
				if (dbug) console.log ("Yup there are OT for " + periods[i]["startDate"] + ".");
				for (var rate in overtimePeriods[periods[i]["startDate"]]) {
					if (dbug) console.log ("rate: " + rate + ".");
					if (dbug) console.log ("amount: " + overtimePeriods[periods[i]["startDate"]][rate] + ".");
					var made = overtimePeriods[periods[i]["startDate"]][rate] * hourly[level][step] * rate;
					var shouldHaveMade = overtimePeriods[periods[i]["startDate"]][rate] * newHourly[level][step] * rate;
					var backpay = shouldHaveMade - made;
					
					var newTR = createHTMLElement("tr", {"parentNode":resultsBody});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": periods[i]["startDate"]});
					var reasonDiv = createHTMLElement("div", {"parentNode":newPaidTD, "textNode":"(Overtime Payment x " + rate + ")", "class":"small"});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(made)}); //.toFixed(2)});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(shouldHaveMade)}); //.toFixed(2)});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(backpay)}); //.toFixed(2)});

					if (dbug || showExtraCols) {
						var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "CS-0" + (level +1)});
						var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": parseInt(step)+1});
						var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": (periods[i]["multiplier"] ? "Yes" : "No")});
						var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": hourly[level][step] * periods[i]["multiplier"] + " * " + rate + "/hr"});
						var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "Hourly " + overtimePeriods[periods[i]["startDate"]][rate]});
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
				var made = lumpSumPeriods[periods[i]["startDate"]] * hourly[level][step];
				var shouldHaveMade = lumpSumPeriods[periods[i]["startDate"]] * newHourly[level][step];
				var backpay = shouldHaveMade - made;
				
				var newTR = createHTMLElement("tr", {"parentNode":resultsBody});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": periods[i]["startDate"]});
				var reasonDiv = createHTMLElement("div", {"parentNode":newPaidTD, "textNode":"(Lump Sum Payment)", "class":"small"});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(made)}); //.toFixed(2)});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(shouldHaveMade)}); //.toFixed(2)});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": formatter.format(backpay)}); //.toFixed(2)});

				
				if (dbug || showExtraCols) {
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "CS-0" + (level +1)});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": parseInt(step)+1});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": (periods[i]["multiplier"] ? "Yes" : "No")});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": hourly[level][step] * periods[i]["multiplier"] + "/hr"});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "Hourly " + lumpSumPeriods[periods[i]["startDate"]]});
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
			var totalTH = createHTMLElement("th", {"parentNode":totalTR, "scope":"row", "nodeText":"Total"});
			var preTD = createHTMLElement("td", {"parentNode":totalTR, "nodeText": formatter.format(total["made"])});
			var preTD = createHTMLElement("td", {"parentNode":totalTR, "nodeText": formatter.format(total["shouldHaveMade"])});
			var preTD = createHTMLElement("td", {"parentNode":totalTR, "nodeText": formatter.format(total["backpay"])});
		}
		resultStatus.innerHTML = "Results shown below.";
	//} else {
		//if (dbug) console.log ("Not the top of your level.  This should be difficult.");
		

	//}
} // End of calculate


function addStartDateErrorMessage () {
	if (dbug) console.log ("Error:  st is " + startDateTxt.value + ".");
	var errDiv = createHTMLElement("div", {"parentNode":startDateTxt.parentNode, "id":"startDateError", "class":"error"});
	createHTMLElement("p", {"parentNode":errDiv, "nodeText":"Please enter the date at which you started at the level you were at on December 22, 2018. If you weren't a CS at that time, enter the date you started as a CS.  All dates must be in the format of YYYY-MM-DD."});
	levelSel.setAttribute("aria-describedby", "startDateError");
	return;
}

var formatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',

  // These options are needed to round to whole numbers if that's what you want.
  //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  // Taken from https://stackoverflow.com/questions/149055/how-to-format-numbers-as-currency-string
});


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
		} else {
			newEl.setAttribute(k, attribs[k]);
		}
	}
	return newEl;
}
function removeChildren (el) {
	var dbug = (arguments.length == 2 && arguments[1] != null && arguments[1] != false ? true : false);
	while (el.firstChild) {	
		el.removeChild(el.firstChild);
	}
}
if (dbug) console.log ("Finished loading backpayCalc.js.");
document.addEventListener('DOMContentLoaded', init, false);
