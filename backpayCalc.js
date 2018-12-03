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
var addActingBtn = null;
var addOvertimeBtn = null;
var addLWoPBtn = null;
var addlumpSumBtn = null;
var endDateTxt = "2017-09-24";
var TABegin = new Date("2014", "11", "22");
var EndDate = new Date("2017", "09", "24");
var timePeriods = ["2014-12-22"];
var day = (1000 * 60 * 60 * 24);
var parts = [];
var resultsBody = null;
var resultsFoot = null;
var resultsTheadTR = null;
var periods = [];
var lumpSumPeriods = {};
var overtimePeriods = {};
var phoenixDateTxt = "2016-04-01";
var actings = 0;
var lumpSums = 0;
var overtimes = 0;
var lwops = 0;
// taken from http://www.tbs-sct.gc.ca/agreements-conventions/view-visualiser-eng.aspx?id=1#toc377133772
var salaries = [
	[53611, 55593, 57573, 59541, 61508, 63474, 65439, 69088],
	[66360, 68486, 70607, 72730, 74855, 76976, 79098, 81222],
	[78333, 81029, 83728, 86428, 89124, 91820, 94517, 97322],
	[89690, 92783, 95875, 98967, 102059, 105151, 108244, 111639],
	[103267, 107116, 110965, 114816, 118666, 122517, 126369, 130217, 134571]

];
var daily = [
	[205.50, 213.10, 220.69, 228.23, 235.77, 243.31, 250.84, 264.83],
	[254.37, 262.52, 270.65, 278.79, 286.93, 295.06, 303.20, 311.34],
	[300.26, 310.60, 320.94, 331.29, 341.63, 351.96, 362.30, 373.05],
	[343.80, 355.65, 367.51, 379.36, 391.21, 403.06, 414.92, 427.93],
	[395.84, 410.59, 425.35, 440.11, 454.87, 469.63, 484.40, 499.15, 515.83]
];
var hourly = [
	[27.40, 28.41, 29.43, 30.43, 31.44, 32.44, 33.45, 35.31],
	[33.92, 35.00, 36.09, 37.17, 38.26, 39.34, 40.43, 41.51],
	[40.04, 41.41, 42.79, 44.17, 45.55, 46.93, 48.31, 49.74],
	[45.84, 47.42, 49.00, 50.58, 52.16, 53.74, 55.32, 57.06],
	[52.78, 54.75, 56.71, 58.68, 60.65, 62.62, 64.59, 66.55, 68.78]
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
	numPromotions = document.getElementById("numPromotions");
	addActingBtn = document.getElementById("addActingBtn");
	addOvertimeBtn = document.getElementById("addOvertimeBtn");
	addLWoPBtn = document.getElementById("addLWoPBtn");
	addlumpSumBtn = document.getElementById("addlumpSumBtn");
	resultsBody = document.getElementById("resultsBody");
	resultsFoot = document.getElementById("resultsFoot");
	resultsTheadTR = document.getElementById("resultsTheadTR");
	phoenixDateTxt = document.getElementById("phoenixDateTxt");
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
	if (levelSel && stepSelect && mainForm && startDateTxt && calcBtn && addActingBtn && numPromotions) {
		if (dbug) console.log ("Adding change event to calcBtn.");
		levelSel.addEventListener("change", populateSalary, false);
		if (levelSel.value.match(/[1-5]/)) populateSalary();
		startDateTxt.addEventListener("change", selectSalary, false);
		if (startDateTxt.value.replace(/[^-\d]/, "").match(/YYYY-MM-DD/)) populateSalary();

		calcBtn.addEventListener("click", startProcess, false);
		addActingBtn.addEventListener("click", addActingHandler, false);
		addLWoPBtn.addEventListener("click", addLWoPHandler, false);
		addOvertimeBtn.addEventListener("click", addOvertimeHandler, false);
		addlumpSumBtn.addEventListener("click", addLumpSumHandler, false);
		numPromotions.addEventListener("change", handlePromotions, false);
	} else {
		if (dbug) console.error ("Couldn't get levelSelect.");
	}
	console.log ("Finished initing.");
}
function populateSalary () {
	removeChildren(stepSelect);
	if (levelSel.value >0 && levelSel.value <= 5) {
		createHTMLElement("option", {"parentNode":stepSelect, "value":"-1", "textNode":"Select Salary"});
		for (var i = 0; i < salaries[(levelSel.value-1)].length; i++) {
			createHTMLElement("option", {"parentNode":stepSelect, "value":i, "textNode":"$" + salaries[levelSel.value-1][i].toLocaleString()});
		}
	}
	if (startDateTxt.value.replace(/[^-\d]/, "").match(/(\d\d\d\d)-(\d\d)-(\d\d)/)) selectSalary();
}
function selectSalary () {
	//if (!(levelSelect.value > 0 && levelSelect.value <= 5))
	var parts = null;
	parts = startDateTxt.value.replace(/[^-\d]/, "").match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
	if (dbug) console.log ("Got startDateTxt " + startDateTxt.value.replace(/[^-\d]/, "") + ".");
	if (dbug) console.log ("Got parts " + parts + ".");
	if (parts[2] == "02" && parts[3] > "28") {
		if (parseInt(parts[1]) % 4 === 0 && parts[3] == "29") {
			// Do nothing right now
		} else {
			parts[3]=(parseInt(parts[1]) % 4 === 0? "29" : "28");
		}
	}
	startDateTxt.value = parts[1] + "-" + parts[2] + "-" + parts[3];
	if (parts && levelSel.value >0 && levelSel.value <= 5) {
		var startDate = new Date(parts[1], parts[2]-1, parts[3]);
		var timeDiff = (TABegin - startDate) / day;
		if (dbug) console.log ("TimeDiff between " + TABegin.toString() + " and " + startDate.toString() + ": "  + timeDiff + ".");
		
		var years = Math.floor(timeDiff/365);
		var step = Math.ceil(years, salaries[levelSel.value].length-1) + 1;
		if (dbug) console.log ("Your step would be " + step + ".");

		//step = Math.min(years, salaries[levelSel.value].length);

		var opts = stepSelect.getElementsByTagName("option");
		for (var i = 0; i < opts.length; i++) {
			if (opts[i].hasAttribute("selected")) opts[i].removeAttribute("selected");
			if (i == step) opts[i].setAttribute("selected", "selected");
		}

	}
}
function startProcess () {
	periods = [];
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
	guessSalary();

	// Add promotions
	addPromotions();
		
	// Add actings
	getActings ();

	// Add lwops
	getLWoPs ();

	// Add Overtimes
	getOvertimes();

	// Add Lump Sums
	getLumpSums ();

	calculate();

}
function guessSalary () {
	var levelSelect = document.getElementById("levelSelect");
	var lvl = levelSelect.value.replace(/\D/, "");
	if (dbug) console.log ("Got level " + lvl + "."); // and start date of " + strtDte + ".");
	if (lvl < 1 || lvl > 5) {
		if (dbug) console.log ("guessSalary::Error:  lvl is -1.");
		var errDiv = createHTMLElement("div", {"parentNode":levelSelect.parentNode, "id":"levelSelectError", "class":"error"});
		createHTMLElement("span", {"parentNode":errDiv, "nodeText":"Please select a level"});
		levelSelect.setAttribute("aria-describedby", "levelSelectError");
		levelSelect.focus();
		//return;
	}
	var strtDte = startDateTxt.value;
	if (dbug) console.log ("guessSalary::Got start date of " + strtDte + ".");
	/*if (lvl > 0 && lvl < salaries.length) {
		if (dbug) console.log ("Valid.");
	} else {
		if (dbug) console.log ("Not Valid.");
	}*/
	level = ((lvl > 0 && lvl < salaries.length+1) ? lvl : null);
	var parts = null;
	parts = strtDte.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
	if (parts[2] == "02" && parts[3] > "28") {
		if (parseInt(parts[1]) % 4 == 0 && parts[3] == "29") {
			// Do nothing right now
		} else {
			parts[3]=(parseInt(parts[1]) % 4  == 0? "29" : "28");
		}
	}
	if (dbug) console.log ("guessSalary::Parts: " + parts + ".");
	if (level && parts) {
		// Edit the increases in this line for future contracts.
		periods = [{startDate : "2014-12-22", "increase":1.25, "reason":"Contractual Increase", "multiplier" : 1}, {startDate : "2015-12-22", "increase":1.25, "reason":"Contractual Increase", "multiplier" : 1}, {startDate : "2016-12-22", "increase":1.25, "reason":"Contractual Increase", "multiplier" : 1}];
		if (level > 0 && level < salaries.length) {
			addPeriod({startDate : "2016-04-01", "increase":1, "reason":"Contractual Wage Adjustment", "multiplier" : 1});
		}
		if (dbug) console.log("guessSalary::Going to add Phoenix date.");
		if (phoenixDateTxt.value.match(/\d\d\d\d-\d\d-\d\d/)) addPeriod({startDate : phoenixDateTxt.value, "increase":0, "reason":"Phoenix", "multiplier":1});
		level -= 1;

		if (dbug) console.log("guessSalary::Got valid data (" + parts[1] + "-" + parts[2] + "-" + parts[3] + ")....now trying to figure out salary.");
		//if (dbug) console.log ("And TABegin: " + TABegin.toString() + ".");
		startDate = new Date(parts[1], parts[2]-1, parts[3]);
		if (dbug) console.log ("guessSalary::Inited start date as " + startDate.toString() + ".");

		if (stepSelect.value && stepSelect.value >= 0 && stepSelect.value < salaries[level].length) {
			step = stepSelect.value;
			if (dbug) console.log ("guessSalary::Got step from the stepSelect.  And it's " + step + ".");
		} else {
			if (dbug) console.log ("guessSalary::Couldn't get step from the stepSelect.  Value: " + stepSelect.value + ".");
			var timeDiff = (TABegin - startDate) / day;
			if (dbug) console.log ("guessSalary::TimeDiff: "  + timeDiff + ".");
		
			var years = Math.floor(timeDiff/365);
			step = Math.min(years, salaries[level].length-1);
			if (dbug) console.log ("guessSalary::Your step would be " + step + ".");
		}
		var stp = step;
		parts = null;
		parts = endDateTxt.value.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
		if (parts) {
			EndDate = new Date(parts[1], (parts[2]-1), parts[3]);
			if (dbug) console.log ("guessSalary::Got EndDateTxt as " + endDateTxt.value + ".");
			//if (dbug) console.log ("Got EndDate as " + EndDate.toISOString().substr(0, 10) + ".");
		}
		//add anniversarys
		if (dbug) console.log ("guessSalary::Going to set anniversary dates.");
		for (var i = 2014; i < EndDate.getFullYear(); i++) {
			if (stp < salaries[level].length) {
				if (dbug) console.log ("guessSalary::Going to set anniversary date " + i + "-" + (startDate.getMonth()+1) + "-" + startDate.getDate() + ".");
				addPeriod ({startDate: i + "-" + ((startDate.getMonth()+1) > 9 ? "" : "0") + (startDate.getMonth()+1)	+ "-" + (startDate.getDate() > 9 ? "" : "0") +  startDate.getDate(), "increase":0, "reason":"Anniversary Increase", "multiplier":1});
				stp++;
			}
		}
		
		if (dbug) console.log ("guessSalary::About to set EndDate to " + EndDate.toISOString().substr(0, 10) + ".");
		addPeriod ({startDate : EndDate.toISOString().substr(0, 10), "increase":0, "reason":"end", "multiplier" : 1});

		if (timeDiff < 0) {
			if (dbug) console.log ("guessSalary::You weren't even there then.");
			// remove all older periods?? Maybe?  Or just somehow make them 0s?
			for (var i = 0; i < periods.length; i++) {
				if (strtDte > periods[i]["startDate"]) periods[i]["multiplier"] = 0;
			}

		} else {
			//var salary = salaries[level][step];
			//if (dbug) console.log ("You were there at that point, and your salary would be $" + salary.toFixed(2) + ".");
		}
		if (dbug) {
			console.log("guessSalary::pre-calc checks:");
			for (var i = 0; i < periods.length; i++) {
				console.log ("guessSalary::" + periods[i]["reason"] + ": " + periods[i]["startDate"] + ".");
			}
		}

	} else {
		if (dbug) console.log ("guessSalary::Something's not valid.  Lvl: " + level + ", strtDte: " + strtDte + ".");
		addStartDateErrorMessage();
	}
}

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
			if (promoDate[0] > "2014-12-22" && promoDate[0] < EndDate.toISOString().substr(0, 10) && promoLevel > 0 && promoLevel <=5) {
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
					addPeriod ({startDate: k + "-" + promoDate[2] + "-" + promoDate[3], "increase":0, "reason":"Anniversary Increase", "multiplier":1});
				}

			} else {
				if (dbug) {
					if (promoDate[0] > "2014-12-22") console.log ("addPromotions::It's after the beginning.");
					if (promoDate[0] < EndDate.toISOString().substr(0, 10)) console.log ("addPromotions::It's before the end.");
					if (promoLevel > 0) console.log ("addPromotions::It's greater than 0.");
					if (promoLevel < 5) console.log ("addPromotions::It's less than or equal to 5.");
				}
			}
		} else {
			if (dbug) console.log("addPromotions::Didn't get promoDate.");
		}
	}
}

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
			if (actingFromDate <= EndDate.toISOString().substr(0, 10) && actingToDate >= "2014-12-22" && actingToDate > actingFromDate) {
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
					if (actingToDate >= "2014-12-22") console.log ("getActings::actingTo is after startDate");
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
			if (dbug) console.log ("getLWoPs::Passed the initial tests.");
			if (lwopFromDate >= "2014-12-22" && lwopFromDate <= EndDate.toISOString().substr(0, 10) && lwopToDate >= "2014-12-22" && lwopToDate <= EndDate.toISOString().substr(0, 10) && lwopToDate > lwopFromDate) {
				if (dbug) console.log ("getLWoPs::And the dates are in the right range.");
				// add a period for starting
				var from = addPeriod({"startDate":lwopFromDate, "increase":0, "reason":"LWoP Start", "multiplier":0});

				// add a period for returning
				var toParts = lwopToDate.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
				lwopToDate = new Date(toParts[1], (toParts[2]-1), toParts[3]);
				lwopToDate.setDate(lwopToDate.getDate() + parseInt(1));
				var to = addPeriod({"startDate":lwopToDate.toISOString().substr(0, 10), "increase":0, "reason":"LWoP Finished", "multiplier":1});
				for (var i = from; i < to; i++) {
					periods[i]["multiplier"] = 0;
				}
				//var fromParts = lwopFromDate.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
				//lwopFromDate = new Date(fromParts[1], (fromParts[2]-1), fromParts[3]);
			} else {
				if (dbug) {
					if (lwopFromDate >= "2014-12-22") console.log ("lwopFrom is after startDate");
					if (lwopFromDate <= EndDate.toISOString().substr(0, 10)) console.log ("lwopFrom is before EndDate");
					if (lwopToDate >= "2014-12-22") console.log ("lwopTo is after startDate");
					if (lwopToDate <= EndDate.toISOString().substr(0, 10)) console.log ("lwopTo is before EndDate");
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
			if (overtimeDate >= "2014-12-22" && overtimeDate <= EndDate.toISOString().substr(0, 10) && overtimeAmount > 0) {
				if (dbug) console.log ("overtimes::And the dates are in the right range.");
				// add a period for starting
				var from = addPeriod({"startDate":overtimeDate, "increase":0, "reason":"Overtime", "multiplier":0, "hours":overtimeAmount, "rate":overtimeRate});
				
			} else {
				if (dbug) {
					if (overtimeDate >= "2014-12-22") console.log ("overtimeDate is after startDate");
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
			if (lumpSumDate >= "2014-12-22" && lumpSumDate <= EndDate.toISOString().substr(0, 10) && lumpSumAmount > 0) {
				if (dbug) console.log ("And the dates are in the right range.");
				// add a period for starting
				var from = addPeriod({"startDate":lumpSumDate, "increase":0, "reason":"Lump Sum", "multiplier":0, "hours":lumpSumAmount});
				
			} else {
				if (dbug) {
					if (lumpSumDate >= "2014-12-22") console.log ("lumpSumDate is after startDate");
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
}
function addActingHandler () {
	var actingsDiv = document.getElementById("actingsDiv");
	
	var id = lwops;
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
	}

	var newActingFromLbl = createHTMLElement("label", {"parentNode":newActingFS, "textNode":"From", "for":"actingFrom" + id});
	var newActingFromDate = createHTMLElement("input", {"parentNode":newActingFS, "id":"actingFrom"+id, "type":"date", "aria-describedby":"dateFormat"});
	var newActingToLbl = createHTMLElement("label", {"parentNode":newActingFS, "textNode":"To", "for":"actingTo"+id});
	var newActingFromDate = createHTMLElement("input", {"parentNode":newActingFS, "id":"actingTo"+id, "type":"date", "aria-describedby":"dateFormat"});
	var br = createHTMLElement("br", {"parentNode":newActingFS});

	var newDelActingBtn = createHTMLElement("input", {"parentNode":newActingFS, "type":"button", "value":"Remove"});
	var newAddActingBtn = createHTMLElement("input", {"parentNode":newActingFS, "type":"button", "value":"Add another acting period"});
	newAddActingBtn.addEventListener("click", addActingHandler, false);
	newDelActingBtn.addEventListener("click", removeActingDiv, false);

	actings++;
}
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

	var newDelLWoPBtn = createHTMLElement("input", {"parentNode":newLWoPFS, "type":"button", "value":"Remove"});
	var newAddLWoPBtn = createHTMLElement("input", {"parentNode":newLWoPFS, "type":"button", "value":"Add another lwop period"});
	newAddLWoPBtn.addEventListener("click", addLWoPHandler, false);
	newDelLWoPBtn.addEventListener("click", removeLWoPDiv, false);

	lwops++;
}

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
	var newOvertimeLegend = createHTMLElement("legend", {"parentNode":newOvertimeFS, "textNode":"Overtime"});

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
	createHTMLElement("option", {"parentNode":newOvertimeRate, "value":"1.5", "nodeText":"1.5x", "selected":"selected"});
	createHTMLElement("option", {"parentNode":newOvertimeRate, "value":"2.0", "nodeText":"2.0x"});

	var newDelOvertimeBtn = createHTMLElement("input", {"parentNode":newOvertimeFS, "type":"button", "value":"Remove"});
	var newAddOvertimeBtn = createHTMLElement("input", {"parentNode":newOvertimeFS, "type":"button", "value":"Add another Lump Sum period"});
	newAddOvertimeBtn.addEventListener("click", addOvertimeHandler, false);
	newDelOvertimeBtn.addEventListener("click", removeOvertimeDiv, false);

	overtimes++;
}

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

	var newDelLumpSumBtn = createHTMLElement("input", {"parentNode":newLumpSumFS, "type":"button", "value":"Remove"});
	var newAddLumpSumBtn = createHTMLElement("input", {"parentNode":newLumpSumFS, "type":"button", "value":"Add another Lump Sum period"});
	newAddLumpSumBtn.addEventListener("click", addLumpSumHandler, false);
	newDelLumpSumBtn.addEventListener("click", removeLumpSumDiv, false);

	lumpSums++;
}
function removeActingDiv (e) {
	var btn= e.target;
	var fs = btn.parentNode;
	fs.parentNode.removeChild(fs);
	actings--;
}
function removeLWoPDiv (e) {
	var btn= e.target;
	var fs = btn.parentNode;
	fs.parentNode.removeChild(fs);
	lwops--;
}
function removeLumpSumDiv (e) {
	var btn= e.target;
	var fs = btn.parentNode;
	fs.parentNode.removeChild(fs);
	lumpSums--;
}

function removeOvertimeDiv (e) {
	var btn= e.target;
	var fs = btn.parentNode;
	fs.parentNode.removeChild(fs);
	overtimes--;
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
		}
	}
	for (var i = 1; i < periods.length && looking; i++) {
		if (p["startDate"] < periods[i]["startDate"]) {
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
				if (overtimePeriods.hasOwnProperty(periods["startDate"])) {
					if (overtimePeriods[periods[i-1]["startDate"]].hasOwnProperty(p["rate"])) {
						overtimePeriods[periods[i-1]["startDate"]][p["rate"]] += p["amount"];
						if (dbug) console.log ("Adding overtime amount to " + periods[i]["startDate"] + " of " +p["hours"] + " x " + p["rate"] + ".");
					} else {
						overtimePeriods[periods[i-1]["startDate"]][p["rate"]] = p["amount"];
						if (dbug) console.log ("Adding overtime amount for " + periods[i-1]["startDate"] + " of " +p["hours"] + " x " + p["rate"] + ".");
					}
				} else {
					if (dbug) console.log("addPeriod::p[rate]: " + p["rate"] + ".");
					if (dbug) console.log("addPeriod::p[hours]: " + p["hours"] + ".");
					overtimePeriods[periods[i-1]["startDate"]] = {};
					overtimePeriods[periods[i-1]["startDate"]][p["rate"]] = p["hours"];
					if (dbug) console.log("addPeriod::Now in " + periods[i-1]["startDate"] + " at rate of " + p["rate"] + ": " + overtimePeriods[periods[i-1]["startDate"]][p["rate"]] + ".");
				}
				looking = false;
			} else {
				periods.splice(i, 0, p);
				rv = i;
				looking = false;
				if (p["reason"]=="end") {
					periods.splice(i+1); 
					rv = periods.length-1;
				}
			}
		} else if (p["startDate"] == periods[i]["startDate"]) {
			if (p["reason"] == "Phoenix") {
				periods[i]["reason"] += " & Phoenix";
				looking = false;
				rv = i;
			} else if (p["reason"] == "Anniversary Increase" && periods[i]["reason"].match(/Contractual/)) {
				periods[i]["reason"] += " & Anniversary Increase";
				looking = false;
				rv = i;
			}
		}
	}
	return rv;
}

function calculate() {
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
						newSalaries[l][s] = Math.round(newSalaries[l][s] * multiplier);
						newDaily[l][s] = (newSalaries[l][s] / 260.88).toFixed(2);
						newHourly[l][s] = (newSalaries[l][s] / 1956.6).toFixed(2);
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
					if (current.getDay() > 0 && current.getDay() < 6) {
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
			var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": periods[i]["startDate"] + " - " + periods[i+1]["startDate"]});
			var reasonDiv = createHTMLElement("div", {"parentNode":newPaidTD, "textNode":"(" + periods[i]["reason"] + ")", "class":"small"});
			var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "$ " + periods[i]["made"].toFixed(2)});
			var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "$ " + periods[i]["shouldHaveMade"].toFixed(2)});
			var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "$ " + periods[i]["backpay"].toFixed(2)});

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
					var made = overtimePeriods[periods[i]["startDate"]][rate] * hourly[level][step] * rate;
					var shouldHaveMade = overtimePeriods[periods[i]["startDate"]][rate] * newHourly[level][step] * rate;
					var backpay = shouldHaveMade - made;
					
					var newTR = createHTMLElement("tr", {"parentNode":resultsBody});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": periods[i]["startDate"]});
					var reasonDiv = createHTMLElement("div", {"parentNode":newPaidTD, "textNode":"(Overtime Payment x " + rate + ")", "class":"small"});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "$ " + made.toFixed(2)});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "$ " + shouldHaveMade.toFixed(2)});
					var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "$ " + backpay.toFixed(2)});

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

			if (lumpSumPeriods.hasOwnProperty(periods[i]["startDate"])) {
				var made = lumpSumPeriods[periods[i]["startDate"]] * hourly[level][step];
				var shouldHaveMade = lumpSumPeriods[periods[i]["startDate"]] * newHourly[level][step];
				var backpay = shouldHaveMade - made;
				
				var newTR = createHTMLElement("tr", {"parentNode":resultsBody});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": periods[i]["startDate"]});
				var reasonDiv = createHTMLElement("div", {"parentNode":newPaidTD, "textNode":"(Lump Sum Payment)", "class":"small"});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "$ " + made.toFixed(2)});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "$ " + shouldHaveMade.toFixed(2)});
				var newPaidTD = createHTMLElement("td", {"parentNode":newTR, "textNode": "$ " + backpay.toFixed(2)});

				
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
			
			
			if (periods[i]["startDate"] < phoenixDateTxt.value) {
				preTotal["made"] += periods[i]["made"];
				preTotal["shouldHaveMade"] += periods[i]["shouldHaveMade"];
				preTotal["backpay"] += periods[i]["backpay"];
			} else {
				pTotal["made"] += periods[i]["made"];
				pTotal["shouldHaveMade"] += periods[i]["shouldHaveMade"];
				pTotal["backpay"] += periods[i]["backpay"];
			}
			
		}
		if (resultsFoot) {
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

			var totalTR = createHTMLElement("tr", {"parentNode":resultsFoot});
			var totalTH = createHTMLElement("th", {"parentNode":totalTR, "scope":"row", "nodeText":"Total"});
			var preTD = createHTMLElement("td", {"parentNode":totalTR, "nodeText":"$" + total["made"].toFixed(2)});
			var preTD = createHTMLElement("td", {"parentNode":totalTR, "nodeText":"$" + total["shouldHaveMade"].toFixed(2)});
			var preTD = createHTMLElement("td", {"parentNode":totalTR, "nodeText":"$" + total["backpay"].toFixed(2)});
		}
	//} else {
		//if (dbug) console.log ("Not the top of your level.  This should be difficult.");
		

	//}
}


function addStartDateErrorMessage () {
	if (dbug) console.log ("Error:  st is " + startDateTxt.value + ".");
	var errDiv = createHTMLElement("div", {"parentNode":startDateTxt.parentNode, "id":"startDateError", "class":"error"});
	createHTMLElement("p", {"parentNode":errDiv, "nodeText":"Please enter the date at which you started at the level you were at on December 22, 2014. If you weren't a CS at that time, enter the date you started as a CS.  All dates must be in the format of YYYY-MM-DD."});
	levelSel.setAttribute("aria-describedby", "startDateError");
	return;
}

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
