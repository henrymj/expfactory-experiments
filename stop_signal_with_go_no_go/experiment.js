/* ************************************ */
/*       Define Helper Functions        */
/* ************************************ */
function getDisplayElement() {
    $('<div class = display_stage_background></div>').appendTo('body')
    return $('<div class = display_stage></div>').appendTo('body')
}

function addID() {
  jsPsych.data.addDataToLastTrial({exp_id: 'stop_signal_with_go_no_go'})
}

function evalAttentionChecks() {
  var check_percent = 1
  if (run_attention_checks) {
    var attention_check_trials = jsPsych.data.getTrialsOfType('attention-check')
    var checks_passed = 0
    for (var i = 0; i < attention_check_trials.length; i++) {
      if (attention_check_trials[i].correct === true) {
        checks_passed += 1
      }
    }
    check_percent = checks_passed / attention_check_trials.length
  }
  jsPsych.data.addDataToLastTrial({"att_check_percent": check_percent})
  return check_percent
}

function assessPerformance() {
	var experiment_data = jsPsych.data.getTrialsOfType('poldrack-single-stim')
	experiment_data = experiment_data.concat(jsPsych.data.getTrialsOfType('poldrack-categorize'))
	var missed_count = 0
	var trial_count = 0
	var rt_array = []
	var rt = 0
	//
	var object_recognition_correct = 0
	var object_recognition_count = 0
	var object_recognition_rt = 0
	var object_recognition_threshold = 0.75  // must achieve accuracy higher than 75% to get credit 
	//
	
		//record choices participants made
	var choice_counts = {}
	choice_counts[-1] = 0
	for (var k = 0; k < possible_responses.length; k++) {
		choice_counts[possible_responses[k][1]] = 0
	}
	for (var i = 0; i < experiment_data.length; i++) {
		if (experiment_data[i].possible_responses != 'none') {
			trial_count += 1
			rt = experiment_data[i].rt
			key = experiment_data[i].key_press
			choice_counts[key] += 1
			if (rt == -1) {
				missed_count += 1
			} else {
				rt_array.push(rt)
			}
		}
		
		if (experiment_data[i].trial_id == "object_recognition_network"){
			object_recognition_count += 1
			if (experiment_data[i].pass_check == true){
				object_recognition_correct += 1
				object_recognition_rt += experiment_data[i].rt
			}
		}
	}
	
	var object_correct = object_recognition_correct / object_recognition_count
	var object_ave_rt = object_recognition_rt / object_recognition_count
	
	//calculate average rt
	var avg_rt = -1
	if (rt_array.length !== 0) {
		avg_rt = math.median(rt_array)
	} 
	//calculate whether response distribution is okay
	var responses_ok = true
	Object.keys(choice_counts).forEach(function(key, index) {
		if (choice_counts[key] > trial_count * 0.85) {
			responses_ok = false
		}
	})
	var missed_percent = missed_count/trial_count
	credit_var = (missed_percent < 0.4 && avg_rt > 200 && responses_ok)
	credit_var = (missed_percent < 0.4 && avg_rt > 200 && responses_ok && object_correct > object_recognition_threshold && object_ave_rt > 200)
	jsPsych.data.addDataToLastTrial({"credit_var": credit_var})
}


var getFeedback = function() {
	return '<div class = bigbox><div class = picture_box><p class = block-text><font color="white">' + feedback_text + '</font></p></div></div>'
}

var getInstructFeedback = function() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
		'</p></div>'
}

var getCategorizeFeedback = function(){
	curr_trial = jsPsych.progress().current_trial_global - 1
	trial_id = jsPsych.data.getDataByTrialIndex(curr_trial).trial_id
	console.log(trial_id)
	if ((trial_id == 'practice_trial') && ((jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'go') ||(jsPsych.data.getDataByTrialIndex(curr_trial).go_no_go_type == 'go'))){
		if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == jsPsych.data.getDataByTrialIndex(curr_trial).correct_response){
			
			
			return '<div class = fb_box><div class = center-text><font size = 20>Correct!</font></div></div>' + prompt_text
		} else if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press != jsPsych.data.getDataByTrialIndex(curr_trial).correct_response) && (jsPsych.data.getDataByTrialIndex(curr_trial).key_press != -1)){
			
			
			return '<div class = fb_box><div class = center-text><font size = 20>Incorrect</font></div></div>' + prompt_text
	
		} else if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == -1){
			
			
			return '<div class = fb_box><div class = center-text><font size = 20>Respond Faster!</font></div></div>' + prompt_text
	
		}
	} else if ((trial_id == 'practice_trial') && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'stop')){
		if (jsPsych.data.getDataByTrialIndex(curr_trial).rt == -1){
			return '<div class = fb_box><div class = center-text><font size = 20>Correct!</font></div></div>' + prompt_text
		} else if (jsPsych.data.getDataByTrialIndex(curr_trial).rt != -1){
			return '<div class = fb_box><div class = center-text><font size = 20>There was a star.</font></div></div>' + prompt_text
		}
	
	} else if (jsPsych.data.getDataByTrialIndex(curr_trial).go_no_go_type == 'stop'){
	
		return '<div class = fb_box><div class = center-text><font size = 20>Shape was '+go_no_go_styles[1]+'</font></div></div>' + prompt_text
	}
}

var createTrialTypes = function(numTrialsPerBlock){
	var unique_combos = 60
	
	var stims = []
	for (var i = 0; i < go_no_go_types.length; i++){
		for (var x = 0; x < stop_signal_conditions.length; x++){
			for (var j = 0; j < totalShapesUsed; j++){
				stim = {
					stim: shapes[j],
					correct_response: possible_responses[j][1],
					stop_signal_condition: stop_signal_conditions[x],
					go_no_go_type: go_no_go_types[i]
			
				}
			
				stims.push(stim)
			}	
		
		}
	
	}
	
	var iteration = numTrialsPerBlock/unique_combos
	
	stims = jsPsych.randomization.repeat(stims,iteration)
	return stims
}


var getStopStim = function(){
	return preFileType + pathSource + 'stopSignal' + fileType + postFileType
}

var getStim = function(){

	if(exp_phase == "practice1"){
		stim = stims.pop()
		shape = stim.stim
		correct_response = stim.correct_response
		go_no_go_type = "practice_no_go"
		stop_signal_condition = "practice_no_stop"
		
	} else if ((exp_phase == "test") || (exp_phase == "practice2")){
		stim = stims.pop()
		shape = stim.stim
		stop_signal_condition = stim.stop_signal_condition
		go_no_go_type = stim.go_no_go_type
		correct_response = stim.correct_response
		
		if (go_no_go_type == 'stop'){
			stim_style = go_no_go_styles[1]
		} else if (go_no_go_type == 'go'){
			stim_style = go_no_go_styles[0]
		}
		
		
		if((stop_signal_condition == "stop")||(go_no_go_type == "stop")){
			correct_response = -1
		} 
	}
	
	stim = {
		image: '<centerbox>'+preFileType + pathSource + stim_style + '_' + shape + fileType + postFileType+'</div>',
		data: { 
			stim: shape,
			stim_style: stim_style,
			stop_signal_condition: stop_signal_condition,
			go_no_go_type: go_no_go_type,
			correct_response: correct_response
			}
	}
	stimData = stim.data
	return stim.image
}


function getSSD(){
	return SSD
}

function getSSType(){
	return stop_signal_condition

}


var appendData = function(){
	curr_trial = jsPsych.progress().current_trial_global
	current_trial+=1

	if (exp_phase == "practice1"){
		currBlock = practiceCount
	} else if (exp_phase == "practice2"){
		currBlock = practiceStopCount
	} else if (exp_phase == "test"){
		currBlock = testCount
	}
	
	if ((exp_phase == "practice1") || (exp_phase == "practice2") || (exp_phase == "test")){
		jsPsych.data.addDataToLastTrial({
			stim: stimData.stim,
			stim_style: stim_style,
			correct_response: correct_response,	
			current_block: currBlock,
			current_trial: current_trial,
			stop_signal_condition: stimData.stop_signal_condition,
			go_no_go_condition: stimData.go_no_go_type
		})
	}
	
	
	if (exp_phase == "test"){	
		
		if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press == -1) && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'stop') && (SSD < maxSSD)){
			jsPsych.data.addDataToLastTrial({stop_acc: 1})
			SSD+=50
		} else if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press != -1) && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'stop') && (SSD > minSSD)){
			jsPsych.data.addDataToLastTrial({stop_acc: 0})
			SSD-=50
		}
		
	
		if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press == jsPsych.data.getDataByTrialIndex(curr_trial).correct_response) && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'go')){
			jsPsych.data.addDataToLastTrial({go_acc: 1})
		} else if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press != jsPsych.data.getDataByTrialIndex(curr_trial).correct_response) && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'go')){
			jsPsych.data.addDataToLastTrial({go_acc: 0})
		}
		
	}
	
}

/* ************************************ */
/*    Define Experimental Variables     */
/* ************************************ */
// generic task variables
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds
var credit_var = 0
var run_attention_checks = true

var practice_len = 15 // 15 must be divisible by 60
var exp_len = 300 //300 must be divisible by 60
var numTrialsPerBlock = 60 // 60, must be divisible by 60
var numTestBlocks = exp_len / numTrialsPerBlock
var practice_thresh = 3 // 3 blocks of 16 trials

var SSD = 250
var maxSSD = 1000
var minSSD = 0 
var current_trial = 0


var rt_thresh = 1000;
var missed_response_thresh = 0.10;
var accuracy_thresh = 0.70;

var stop_signal_respond_lower_thresh = 0.30
var stop_signal_respond_upper_thresh = 0.70


var stop_signal_conditions = ['go','go','stop']
var go_no_go_types = ['go','go','go','go','stop']
var go_no_go_styles = ['solid','unfilled'] //has dashed as well
var shapes = ['circle','square','triangle','pentagon']
//'hourglass', 'Lshape', 'moon', 'oval', 'rectangle', 'rhombus', 'tear', 'trapezoid'
var color = "black"
var totalShapesUsed = 4


var possible_responses = [['Z key', 90], ['Z key', 90], ['M key', 77], ['M key', 77]]


var postFileType = "'></img>"
var pathSource = "/static/experiments/stop_signal_with_go_no_go/images/"
var fileType = ".png"
var preFileType = "<img class = center src='"



var images = []
for(i=0;i<shapes.length;i++){
	images.push(pathSource + shapes[i] + '.png')
}
jsPsych.pluginAPI.preloadImages(images);



var prompt_text_list = '<ul list-text>'+
						'<li>' + shapes[0] + ': ' + possible_responses[0][0] + '</li>' +
						'<li>' + shapes[1] + ': ' + possible_responses[0][0] + '</li>' +
						'<li>' + shapes[2] + ': ' + possible_responses[2][0] + '</li>' +
						'<li>' + shapes[3] + ': ' + possible_responses[2][0] + '</li>' +
						'<li>Do not respond if a star appears!</li>' +
						'<li>Do not respond if the shape is '+go_no_go_styles[1]+'!</li>' +
					  '</ul>'

var prompt_text = '<div class = prompt_box>'+
					  '<p class = center-block-text style = "font-size:16px; line-height:80%%;">' + shapes[0] + ': ' + possible_responses[0][0] + '</p>' +
					  '<p class = center-block-text style = "font-size:16px; line-height:80%%;">' + shapes[1] + ': ' + possible_responses[0][0] + '</p>' +
					  '<p class = center-block-text style = "font-size:16px; line-height:80%%;">' + shapes[2] + ': ' + possible_responses[2][0] + '</p>' +
					  '<p class = center-block-text style = "font-size:16px; line-height:80%%;">' + shapes[3] + ': ' + possible_responses[2][0] + '</p>' +
					  '<p class = center-block-text style = "font-size:16px; line-height:80%%;">Do not respond if a star appears!</p>' +
					  '<p class = center-block-text style = "font-size:16px; line-height:80%%;">Do not respond if the shape is '+go_no_go_styles[1]+'!</p>' +
				  '</div>'



var stims = createTrialTypes(numTrialsPerBlock)
var exp_phase = "practice1"
var exp_phase = "practice2"




/* ************************************ */
/*        Set up jsPsych blocks         */
/* ************************************ */
// Set up attention check node
var run_attention_checks = true
var attention_check_block = {
  type: 'attention-check',
  data: {
    trial_id: "attention_check"
  },
  timing_response: 180000,
  response_ends_trial: true,
  timing_post_trial: 200
}

var attention_node = {
  timeline: [attention_check_block],
  conditional_function: function() {
    return run_attention_checks
  }
}

var end_block = {
	type: 'poldrack-text',
	data: {
		exp_id: "stop_signal_with_go_no_go",
		trial_id: "end"
	},
	timing_response: 180000,
	text: '<div class = centerbox>'+
	'<p class = center-block-text>Thanks for completing this task!</p>'+
	'<p class = center-block-text>Press<i> enter</i> to continue.</p>'+
	'</div>',
	cont_key: [13],
	timing_post_trial: 0,
	on_finish: function(){
  	assessPerformance()
  	evalAttentionChecks()
  }
};

var welcome_block = {
	type: 'poldrack-text',
	data: {
		exp_id: "stop_signal_with_go_no_go",
		trial_id: "welcome"
	},
	timing_response: 180000,
	text: '<div class = centerbox>'+
	'<p class = center-block-text>Welcome to the task!</p>'+
	'<p class = center-block-text>Press<i> enter</i> to continue.</p>'+
	'</div>',
	cont_key: [13],
	timing_post_trial: 0
};

var feedback_instruct_text =
	'Welcome to the experiment. This experiment will take about 30 minutes. Press <i>enter</i> to begin.'
var feedback_instruct_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "instruction"
	},
	cont_key: [13],
	text: getInstructFeedback,
	timing_post_trial: 0,
	timing_response: 180000
};
/// This ensures that the subject does not read through the instructions too quickly.  If they do it too quickly, then we will go over the loop again.
var instructions_block = {
	type: 'poldrack-instructions',
	data: {
		exp_id: "stop_signal_with_go_no_go",
		trial_id: "instruction"
	},
	pages:[
		'<div class = centerbox>'+
			'<p class = block-text>In this task you will see shapes appear on the screen one at a time. </p>' +
			'<p class = block-text>Only one response is correct for each shape.</p>'+
			'<p class = block-text>If the shape is a '+shapes[0]+' or a '+shapes[1]+', press the '+possible_responses[0][0]+'.</p>'+
			'<p class = block-text>If the shape is a '+shapes[2]+' or a '+shapes[3]+', press the '+possible_responses[2][0]+'.</p>'+
			'<p class = block-text>You should respond as quickly and accurately as possible to each shape.</p>'+
		'</div>',
		
		'<div class = centerbox>' + 
			'<p class = block-text>On some trials, a star will appear around the shape.  The star will appear with, or shortly after the shape appears.</p>'+
			
			'<p class = block-text>If you see a star appear, please try your best to withhold your response on that trial.</p>'+
			
			'<p class = block-text>If the star appears on a trial, and you try your best to withhold your response, you will find that you will be able to stop sometimes but not always</p>'+
		
			'<p class = block-text>Please do not slow down your responses in order to wait for the star.  Continue to respond as quickly and accurately as possible.</p>'+
								
		'</div>',
		
		"<div class = centerbox>"+
			"<p class = block-text>Additionally, on most trials, the shapes will be "+go_no_go_styles[0]+".  Sometimes, the shapes will be "+go_no_go_styles[1]+".</p>"+
			"<p class = block-text>If the shapes are "+go_no_go_styles[1]+", please make no response on that trial.</p>"+
		"</div>",
		
		"<div class = centerbox>"+
			"<p class = block-text>On trials where you see both a star and a "+go_no_go_styles[1]+" shape, make no response on that trial.</p>"+
			"<p class = block-text>You must respond if a star does not appear, and if the shapes are "+go_no_go_styles[0]+".</p>"+
			'<p class = block-text>We will start practice when you finish instructions. Please make sure you understand the rules before moving on. During practice, you will see a reminder of the rules.  <i> This will be removed for test</i>.</p>'+
		"</div>",
	],
	allow_keys: false,
	show_clickable_nav: true,
	timing_post_trial: 0,
};
var instruction_node = {
	timeline: [feedback_instruct_block, instructions_block],
	/* This function defines stopping criteria */
	loop_function: function(data) {
		for (i = 0; i < data.length; i++) {
			if ((data[i].trial_type == 'poldrack-single-stim') && (data[i].rt != -1)) {
				rt = data[i].rt
				sumInstructTime = sumInstructTime + rt
			}
		}
		if (sumInstructTime < instructTimeThresh * 1000) {
			feedback_instruct_text =
				'Read through instructions too quickly.  Please take your time and make sure you understand the instructions.  Press <i>enter</i> to continue.'
			return true
		} else if (sumInstructTime > instructTimeThresh * 1000) {
			feedback_instruct_text = 'Done with instructions. Press <i>enter</i> to continue.'
			return false
		}
	}
}

var fixation_block = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><div class = fixation>+</div></div>',
	is_html: true,
	choices: 'none',
	data: {
		exp_id: "stop_signal_with_go_no_go",
		trial_id: "fixation",
	},
	timing_post_trial: 0,
	timing_stim: 500,
	timing_response: 500
};

var prompt_fixation_block = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><div class = fixation>+</div></div>',
	is_html: true,
	choices: 'none',
	data: {
		exp_id: "stop_signal_with_go_no_go",
		trial_id: "prompt_fixation",
	},
	timing_post_trial: 0,
	timing_stim: 500,
	timing_response: 500,
	prompt: prompt_text
};


var practice_intro = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><p class = block-text>We will now start the practice for the experiment.<br><br>For these trials, you must press the <i>'+possible_responses[0][0]+'</i>, '+ ' or <i>'+possible_responses[2][0]+ ' </i>depending on the shape of the stimulus.  Make sure to respond as quickly and accurately as possible to the shape. <br><br> The responses for each shape are as follows: ' +
		prompt_text +
		'</p><p class = block-text>Remember these rules before you proceed.</p><p class = block-text>Press <i> enter</i> to begin.</p></div>',
	is_html: true,
	choices: [13],
	data: {
		exp_id: "stop_signal_with_go_no_go",
		"trial_id": "stop_intro_phase1"
	},
	timing_post_trial: 0,
	timing_response: 180000,
	response_ends_trial: true
};

var test_intro = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox>'+
				'<p class = block-text>We will now begin the test portion.</p>'+
				'<p class = block-text>You will see a shape on every trial. Please respond to each shape as quickly and accurately as possible!</p>'+
				'<p class = block-text>If the shape is a '+shapes[0]+' or a '+shapes[1]+', press the '+possible_responses[0][0]+'.</p>'+
				'<p class = block-text>If the shape is a '+shapes[2]+' or a '+shapes[3]+', press the '+possible_responses[2][0]+'.</p>'+
				'<p class = block-text>Do not respond if you see a star</p>'+
				'<p class = block-text>Do not respond if the shape is '+go_no_go_styles[1]+'</p>'+
				'<p class = block-text>You will no longer receive the rule prompt, so remember the instructions before you continue. Press Enter to begin.</p>'+
			 '</div>',
	
	is_html: true,
	choices: [13],
	data: {
		exp_id: "stop_signal_with_go_no_go",
		"trial_id": "test_intro"
	},
	timing_post_trial: 0,
	timing_response: 180000,
	response_ends_trial: true,
	on_finish: function(){
		feedback_text = 'We will now start the test session. Please concentrate on responding quickly and accurately to each stimuli.'
	}
};

var feedback_text = 
	'Welcome to the experiment. This experiment will take about 30 minutes. Press <i>enter</i> to begin.'
var feedback_block = {
	type: 'poldrack-single-stim',
	data: {
		exp_id: "stop_signal_with_go_no_go",
		trial_id: "practice-no-stop-feedback"
	},
	choices: [13],
	stimulus: getFeedback,
	timing_post_trial: 0,
	is_html: true,
	timing_response: 180000,
	response_ends_trial: true, 

};

//Set up post task questionnaire
var post_task_block = {
   type: 'survey-text',
   data: {
       trial_id: "post task questions"
   },
   questions: ['<p class = center-block-text style = "font-size: 20px">Please summarize what you were asked to do in this task.</p>',
              '<p class = center-block-text style = "font-size: 20px">Do you have any comments about this task?</p>'],
   rows: [15, 15],
   columns: [60,60],
   timing_response: 360000
};
/********************************************/
/*				Set up nodes				*/
/********************************************/

var practiceStopTrials = []
practiceStopTrials.push(feedback_block)
practiceStopTrials.push(instructions_block)
for (i = 0; i < practice_len; i++) {
	practiceStopTrials.push(prompt_fixation_block)
	var practice_block = {
		type: 'stop-signal',
		stimulus: getStim,
		SS_stimulus: getStopStim,
		SS_trial_type: getSSType,
		data: {
			exp_id: "stop_signal_with_go_no_go",
			"trial_id": "practice_trial",
		},
		is_html: true,
		choices: [possible_responses[0][1], possible_responses[2][1]],
		timing_stim: 1000,
		timing_response: 2000,
		response_ends_trial: false,
		SSD: getSSD,
		timing_SS: 500,
		timing_post_trial: 0,
		on_finish: appendData,
		prompt: prompt_text,
		on_start: function(){
			stoppingTracker = []
			stoppingTimeTracker = []
		}
	}
	
	var categorize_block = {
		type: 'poldrack-single-stim',
		data: {
			trial_id: "practice-stop-feedback"
		},
		choices: 'none',
		stimulus: getCategorizeFeedback,
		timing_post_trial: 0,
		is_html: true,
		timing_stim: 500,
		timing_response: 500,
		response_ends_trial: false, 

	};

	practiceStopTrials.push(practice_block)
	practiceStopTrials.push(categorize_block)

}


var practiceStopCount = 0
var practiceStopNode = {
	timeline: practiceStopTrials,
	loop_function: function(data) {
		practiceStopCount = practiceStopCount + 1
		current_trial = 0
		stims = createTrialTypes(numTrialsPerBlock)
		
		var total_trials = 0
		
		var sum_stop_rt = 0;
		var sum_go_rt = 0;
		var sum_gng_rt = 0;
		
		var sumGo_correct = 0;
		var sumStop_correct = 0;
		var sumGNG_correct = 0;
		
		var num_go_responses = 0;
		var num_stop_responses = 0;
		var num_gng_responses = 0;
		
		var go_length = 0;
		var stop_length = 0
		var go_no_go_length = 0
		
		for (i = 0; i < data.length; i++) {
			if (data[i].trial_id == "practice_trial"){
				total_trials += 1
			}
			
			if ((data[i].stop_signal_condition == "go") && (data[i].go_no_go_condition == "go")){
				go_length += 1
				if (data[i].rt != -1) {
					num_go_responses += 1
					sum_go_rt += data[i].rt;
					if (data[i].key_press == data[i].correct_response) {
						sumGo_correct += 1
					}
				}				
			} else if (data[i].stop_signal_condition == "stop") {
				stop_length += 1
				if (data[i].rt != -1){
					num_stop_responses += 1
					sum_stop_rt += data[i].rt
				} else if (data[i].rt == -1){
					sumStop_correct += 1
				}				
			} else if (data[i].go_no_go_condition == "stop") {
				go_no_go_length += 1
				if (data[i].rt != -1){
					num_gng_responses += 1
					sum_gng_rt += data[i].rt
				} else if (data[i].rt == -1){
					sumGNG_correct += 1
				}				
			}
		}
		
		var average_rt = sum_go_rt / num_go_responses;
		var missed_responses = (go_length - num_go_responses) / go_length
		
		var aveShapeRespondCorrect = sumGo_correct / go_length 
		
		var stop_signal_respond = num_stop_responses / stop_length
		var gng_respond = num_gng_responses / go_no_go_length
			

		feedback_text = "<br>Please take this time to read your feedback and to take a short break. Press enter to continue"
		feedback_text += "</p><p class = block-text><i>Average reaction time:  " + Math.round(average_rt) + " ms. 	Accuracy for trials that require a response: " + Math.round(aveShapeRespondCorrect * 100)+ "%</i>"

		if (practiceStopCount == 3) {
			feedback_text += '</p><p class = block-text>Done with this practice.'
			exp_phase = "test"
			return false;
		}
		
		if ((aveShapeRespondCorrect > accuracy_thresh) && (stop_signal_respond > stop_signal_respond_lower_thresh) && (stop_signal_respond < stop_signal_respond_upper_thresh)){
			feedback_text += '</p><p class = block-text>Done with this practice.'
			exp_phase = "test"
			return false;
		
		} else {
			if (aveShapeRespondCorrect < accuracy_thresh) {
				feedback_text +=
					'</p><p class = block-text>Your accuracy is too low. Remember:<br>' +
					prompt_text_list
			}
			
			if (average_rt > rt_thresh) {
				feedback_text +=
				'</p><p class = block-text>You have been responding too slowly, please respond to each shape as quickly and as accurately as possible.'
			}
			
			if (missed_responses > missed_response_thresh){
				if(aveShapeRespondCorrect < accuracy_thresh){
					feedback_text +=
					'</p><p class = block-text>We have detected a number of trials that <i>required a response</i>, where no response was made.  Please <i>ensure that you are responding accurately and quickly  </i>to the shapes.'
							
				
				} else {
					feedback_text +=
					'</p><p class = block-text>We have detected a number of trials that <i>required a response</i>, where no response was made.  Please <i>ensure that you are responding accurately and quickly  </i>to the shapes.<br>' +
					prompt_text_list
				}
			}
			
			if (stop_signal_respond < stop_signal_respond_lower_thresh) {
				feedback_text +=
				'</p><p class = block-text>Please stop your response if you see a star.'
			} else if (stop_signal_respond > stop_signal_respond_upper_thresh) {
				feedback_text +=
				'</p><p class = block-text>You have been responding too slowly, please respond to each shape as quickly and as accurately as possible.'
				
			}
			
			feedback_text += '</p><p class = block-text>Redoing this practice.'
			return true	
		}
	}
}




var testTrials = []
testTrials.push(feedback_block)
testTrials.push(attention_node)
for (i = 0; i < numTrialsPerBlock; i++) { 
	testTrials.push(fixation_block)
	var test_block = {
		type: 'stop-signal',
		stimulus: getStim,
		SS_stimulus: getStopStim,
		SS_trial_type: getSSType,
		data: {
			exp_id: "stop_signal_with_go_no_go",
			"trial_id": "stim",
			"exp_stage": "test_trial",
		},
		is_html: true,
		choices: [possible_responses[0][1], possible_responses[2][1]],
		timing_stim: 1000,
		timing_response: 2000,
		response_ends_trial: false,
		SSD: getSSD,
		timing_SS: 500,
		timing_post_trial: 0,
		on_finish: appendData,
		on_start: function(){
			stoppingTracker = []
			stoppingTimeTracker = []
		}
	}
	
	testTrials.push(test_block)
}

var testCount = 0
var testNode = {
	timeline: testTrials,
	loop_function: function(data) {
		current_trial = 0
		testCount += 1
		stims = createTrialTypes(numTrialsPerBlock)
		
		var total_trials = 0
		
		var sum_stop_rt = 0;
		var sum_go_rt = 0;
		var sum_gng_rt = 0;
		
		var sumGo_correct = 0;
		var sumStop_correct = 0;
		var sumGNG_correct = 0;
		
		var num_go_responses = 0;
		var num_stop_responses = 0;
		var num_gng_responses = 0;
		
		var go_length = 0;
		var stop_length = 0
		var go_no_go_length = 0
		
		for (i = 0; i < data.length; i++) {
			if (data[i].trial_id == "practice_trial"){
				total_trials += 1
			}
			
			if ((data[i].stop_signal_condition == "go") && (data[i].go_no_go_condition == "go")){
				go_length += 1
				if (data[i].rt != -1) {
					num_go_responses += 1
					sum_go_rt += data[i].rt;
					if (data[i].key_press == data[i].correct_response) {
						sumGo_correct += 1
					}
				}				
			} else if (data[i].stop_signal_condition == "stop") {
				stop_length += 1
				if (data[i].rt != -1){
					num_stop_responses += 1
					sum_stop_rt += data[i].rt
				} else if (data[i].rt == -1){
					sumStop_correct += 1
				}				
			} else if (data[i].go_no_go_condition == "stop") {
				go_no_go_length += 1
				if (data[i].rt != -1){
					num_gng_responses += 1
					sum_gng_rt += data[i].rt
				} else if (data[i].rt == -1){
					sumGNG_correct += 1
				}				
			}
		}
		
		var average_rt = sum_go_rt / num_go_responses;
		var missed_responses = (go_length - num_go_responses) / go_length
		
		var aveShapeRespondCorrect = sumGo_correct / go_length 
		
		var stop_signal_respond = num_stop_responses / stop_length
		var gng_respond = num_gng_responses / go_no_go_length
		

		feedback_text = "<br>Please take this time to read your feedback and to take a short break. Press enter to continue"
		feedback_text += "</p><p class = block-text><i>Average reaction time:  " + Math.round(average_rt) + " ms. Accuracy for trials that require a response: " + Math.round(aveShapeRespondCorrect * 100)+ "%</i>"
		feedback_text += "</p><p class = block-text>You have completed: "+testCount+" out of "+numTestBlocks+" blocks of trials."
		
		if (testCount == numTestBlocks) {
			feedback_text += '</p><p class = block-text>Done with this test.'
			
			return false;
		} else {
			
			if (aveShapeRespondCorrect < accuracy_thresh) {
				feedback_text +=
					'</p><p class = block-text>Your accuracy is too low. Remember:<br>' +
					prompt_text_list
			}
			if (average_rt > rt_thresh) {
				feedback_text +=
				'</p><p class = block-text>You have been responding too slowly, please respond to each shape as quickly and as accurately as possible.'
			}
			if (missed_responses > missed_response_thresh){
				if(aveShapeRespondCorrect < accuracy_thresh){
					feedback_text +=
					'</p><p class = block-text>We have detected a number of trials that <i>required a response</i>, where no response was made.  Please <i>ensure that you are responding accurately and quickly  </i>to the shapes.'
							
				
				} else {
					feedback_text +=
					'</p><p class = block-text>We have detected a number of trials that <i>required a response</i>, where no response was made.  Please <i>ensure that you are responding accurately and quickly  </i>to the shapes.<br>' +
					prompt_text_list
				}
			}
			
			if (stop_signal_respond > stop_signal_respond_lower_thresh) {
				feedback_text +=
				'</p><p class = block-text>Please stop your response if you see a star.'
			} else if ((stop_signal_respond < stop_signal_respond_lower_thresh) && (average_rt <= rt_thresh)) {
				feedback_text +=
				'</p><p class = block-text>You have been responding too slowly, please respond to each shape as quickly and as accurately as possible.'
			}
			
			
			
			return true;
		}
	}
}


/* ************************************ */
/*          Set up Experiment           */
/* ************************************ */

var stop_signal_with_go_no_go_experiment = []

stop_signal_with_go_no_go_experiment.push(practiceStopNode)
stop_signal_with_go_no_go_experiment.push(feedback_block);

stop_signal_with_go_no_go_experiment.push(visualCheckNode)

stop_signal_with_go_no_go_experiment.push(test_intro);
stop_signal_with_go_no_go_experiment.push(testNode);
stop_signal_with_go_no_go_experiment.push(feedback_block);

stop_signal_with_go_no_go_experiment.push(visualCheckNode)

stop_signal_with_go_no_go_experiment.push(post_task_block);
stop_signal_with_go_no_go_experiment.push(end_block);





