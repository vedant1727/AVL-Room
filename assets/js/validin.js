/*----------------------------------------------------------------------*

 	VALIDIN.JS
	made by Thom Hines
	MIT License

*----------------------------------------------------------------------*/

var options = {
	validation_tests: {
		'alpha': {
			'regex': /[a-zA-Z]*/,
			'error_message': "This can only contain only letters"
		},
		'alpha_num': {
			'regex':  /[A-Z0-9]*/i,
			'error_message': "This can only contain letters and numbers"
		},
		'alpha_space': {
			'regex': /[A-Z ]*/i,
			'error_message': "This can only contain letters"
		},
		'alpha_dash': {
			'regex': /[A-Z\.\-_]*/i,
			'error_message': "This can only contain letters, underscores and hyphens"
		},
		'alpha_num_dash': {
			'regex': /[A-Z0-9\.\-_]*/i,
			'error_message': "This can only contain letters, numbers, underscores and hyphens"
		},
		'number': {
			'regex': /[\d]*/,
			'error_message': "This needs to be a valid whole number"
		},
		'decimal': {
			'regex': /(\d*\.?\d*)/,
			'error_message': "This needs to be a valid number"
		},
		'name': {
			'regex': /[A-Z\.\-'\s]*/i,
			'error_message': "This needs to be a valid name"
		},
		'address': {
			'regex': /[A-Z0-9 \.\-',/]*/i,
			'error_message': "This needs to be a valid name"
		},
		'state_city': {
			'regex': /[A-Z ]*/i,
			'error_message': "This needs to be a valid name"
		},
		'email': {
			'regex': /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/i,
			'error_message': "This needs to be a valid email address"
		},
		'url': {
			'regex': /(https?|ftp):\/\/[^\s\/$.?#].[^\s]*/i,
			'error_message': "This needs to be a valid URL"
		},
		'phone': {
			'regex': /[0-9]{10}/i,
			'error_message': "Enter a valid 10 digit phone number"
		},
		'zip': {
			'regex': /[0-9]{6}/i,
			'error_message': "This needs to be a valid zip code"
		},
		'creditcard': {
			'regex': /(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})/i,
			'error_message': "This needs to be a valid credit card number"
		},
		'regex': {
			'regex': /.*/i,
			'error_message': "This is not a valid value"
		},
		'min': {
			'regex': /.*/i,
			'error_message': "This number needs to be at least %i"
		},
		'max': {
			'regex': /.*/i,
			'error_message': "This number needs to no more than %i"
		},
		'min_length': {
			'regex': /.*/i,
			'error_message': "This needs to be at least %i characters long"
		},
		'max_length': {
			'regex': /.*/i,
			'error_message': "This needs to be no more than %i characters long"
		},
		'match': {
			'regex': /.*/i,
			'error_message': "These values have to match"
		}
	},
	feedback_delay: 300,
	invalid_input_class: 'invalid',
	error_message_class: "validation_error",
	override_input_margins: true,
	tests: {},
	onValidateInput: function() {}
}




jQuery.fn.validin = function(user_options) {
	if(jQuery(this).is('form')) jQuery(this).applyValidation(user_options);
	else jQuery(this).find('form').applyValidation(user_options);
}



jQuery.fn.applyValidation = function(user_options) {

	jQuery.extend(options, user_options);

	$form = jQuery(this);
	$inputs = $form.find(':input');

	disableParentForm($form);

	// Validate input when it is changed or blurred
	$inputs.on('input blur', function(e) {
		if(jQuery(this).attr('aria-invalid') == "true" || e.type == 'blur') validateInput(jQuery(this), true, options);
		else validateInput(jQuery(this), false, options);
	});

	// Prevent form from being submitted until it has been checked one last time.
	$inputs.keypress(function(e) {
		if(e.keyCode == 13) {
			$inputs.each(function() {
				validateInput(jQuery(this), true, options);
			});
			$form.find(':input[aria-invalid="true"]').first().focus();
		}
	});
}






var validation_debounce_timeout;
function validateInput($input, run_immediately, _options) {

	has_error = false;
	error_message = '';

	// First check if field is required and filled in
	if($input.attr('required') && $input.val() == "") {
		has_error = true;
		error_message = 'This field is required.';
	}

	// Clear error if previously flagged non-required input is empty
	else if(!$input.attr('required') && $input.val() == "") {
		has_error = false;
		error_message = '';
	}

	// If there is not validation test, set it back to valid
	else if(!$input.attr('validate')) {
		has_error = false;
		error_message = '';
	}

	// Check against validation test regular expression
	else {
		reqs = $input.attr('validate').split('|');

		for(x = 0; x < reqs.length; x++) {
			req_values = reqs[x].split(':');

			if(_options.tests[req_values[0]]) validation_exp = _options.tests[req_values[0]];
			else validation_exp = _options.validation_tests[req_values[0]];

			if(req_values[0] == 'regex') {
				var regex_modifiers = "";

				regex_array = req_values;

				regex_array.splice(0, 1); // splicing and rejoing values in case there were any : characters in the regex string
				regex = regex_array.join(":");
				if(regex.substr(0, 1) == "/") regex = regex.substr(1);
				if(regex.lastIndexOf("/") >= regex.length - 3) {
					regex_modifiers = regex.substr(regex.lastIndexOf("/")+1);
					regex = regex.substr(0, regex.lastIndexOf("/"));
				}

				regex = new RegExp(regex, regex_modifiers);
				if($input.val().replace(regex, '') != '') {
					has_error = true;
					error_message = validation_exp.error_message;
				}
			}

			if(req_values[0] == 'min' && (parseFloat($input.val()) < parseFloat(req_values[1]) || parseFloat($input.val()) != $input.val())) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}

			if(req_values[0] == 'max' && (parseFloat($input.val()) > parseFloat(req_values[1]) || parseFloat($input.val()) != $input.val())) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}

			if(req_values[0] == 'min_length' && $input.val().length < req_values[1]) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}

			else if(req_values[0] == 'max_length' && $input.val().length > req_values[1]) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}

			else if(req_values[0] == 'match' && $input.val() != $(req_values[1]).val()) {
				has_error = true;
				error_message = validation_exp.error_message.replace('%i', req_values[1]);
			}

			else if($input.val().replace(validation_exp.regex, '') != '') {
				has_error = true;
				error_message = validation_exp.error_message;
			}
		}
	}

	clearTimeout(validation_debounce_timeout);

	if(run_immediately) {
		attachMessage($input, error_message);
		if(has_error) $input.attr('aria-invalid', "true").addClass(options.invalid_input_class);
		else $input.attr('aria-invalid', "false").removeClass(options.invalid_input_class);
		disableParentForm($input.closest('form'));
	}
	else {
		validation_debounce_timeout = setTimeout(function() {
			attachMessage($input, error_message);
			if(has_error) $input.attr('aria-invalid', "true").addClass(options.invalid_input_class);
			else $input.attr('aria-invalid', "false").removeClass(options.invalid_input_class);
			disableParentForm($input.closest('form'));
		}, _options.feedback_delay);
	}

	// User callback function
	if(_options.onValidateInput) _options.onValidateInput({
		input: $input[0],
		has_error: error_message.length > 0,
		error_message: error_message
	});
}




// Attaches message to input field
function attachMessage($input, message) {
	// Remove error message if no message is present
	if(message == '' && $input.next().hasClass('validation_error')) {
		$input.next().fadeOut(400, function() {
			$input.next().remove();
		});
		return;
	}
	else if(message == '') return;

	if(!$input.next().hasClass('validation_error')) $input.after('<div class="' + options.error_message_class + '"></div>');

	if(options.override_input_margins) {
		message_margin_top = parseInt($input.next().css('margin-top'));
		message_margin_bottom = parseInt($input.next().css('margin-bottom'));
		input_margin = parseInt($input.css('margin-bottom'));
		$input.next().css('margin-top', -input_margin + 5 + "px").css('margin-bottom', input_margin - 5 + "px");
	}

	if($input.next().html() == message) return;

	$input.next().hide().html(message).fadeIn(400);
}



// Disables form from being submitted
function disableParentForm($form) {
	has_error = false;

	if($form.find(':input[aria-invalid="true"]').length) has_error = true;

	// Check to see if all required fields have values
	if($form.find(':input[required]').filter(function() { return jQuery(this).val() == ""; }).length) has_error = true;

	if(has_error) 
		$form.find('button, input[type="submit"]').prop('disabled', true);
		//var submit_button_message = document.createElement("p");
		//var dissable_message = document.createTextNode("Please fill the required details correctly to proceed.");
		//submit_button_message.appendChild(dissable_message);
		//document.getElementsByClassName("button-message").appendChild(submit_button_message);
	else 
		$form.find('button, input[type="submit"]').prop('disabled', false);
}
