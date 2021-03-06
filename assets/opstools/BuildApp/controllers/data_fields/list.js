steal(function () {
	var componentIds = {
		editView: 'ab-new-select-list',
		listOptions: 'ab-new-select-option',
		newOption: 'ab-new-select-new',
	};

	// General settings
	var listDataField = {
		name: 'list',
		type: 'string', // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
		icon: 'th-list',
		menuName: 'Select list',
		includeHeader: true,
		description: 'Single select allows you to select a single predefined options below from a dropdown.'
	};

	var removedOptionIds = [];

	// Edit definition
	listDataField.editDefinition = {
		id: componentIds.editView,
		rows: [
			{ view: "label", label: "<b>{0}</b>".replace('{0}', "Options") },
			{
				view: "editlist",
				id: componentIds.listOptions,
				template: "<div style='position: relative;'>#label#<i class='ab-new-field-remove fa fa-remove' style='position: absolute; top: 7px; right: 7px;'></i></div>",
				autoheight: true,
				drag: true,
				editable: true,
				editor: "text",
				editValue: "label",
				onClick: {
					"ab-new-field-remove": function (e, id, trg) {
						var dataId = $$(componentIds.listOptions).getItem(id).dataId;

						// Store removed id to array
						if (typeof dataId === 'number')
							removedOptionIds.push(dataId);

						$$(componentIds.listOptions).remove(id);
					}
				}
			},
			{
				view: "button",
				value: "Add new option",
				click: function () {
					var temp_id = 'temp_' + webix.uid();
					var itemId = $$(componentIds.listOptions).add({ id: temp_id, dataId: temp_id, label: '' }, $$(componentIds.listOptions).count());
					$$(componentIds.listOptions).edit(itemId);
				}
			}
		]
	};

	// Populate settings (when Edit field)
	listDataField.populateSettings = function (application, data) {
		if (!data.setting) return;

		var options = [];
		data.setting.options.forEach(function (opt) {
			options.push({
				dataId: opt.dataId,
				id: opt.id,
				label: opt.label
			});
		});
		$$(componentIds.listOptions).parse(options);
		$$(componentIds.listOptions).refresh();
	};

	// For save field
	listDataField.getSettings = function () {
		var fieldInfo = {
			fieldName: listDataField.name,
			type: 'string',
			setting: {
				icon: listDataField.icon,
				filter_type: 'list',
				editor: 'richselect',
				options: [],
				filter_options: []
			}
		};

		$$(componentIds.listOptions).editStop(); // Close edit mode
		$$(componentIds.listOptions).data.each(function (opt) {
			var optId = typeof opt.dataId == 'string' && opt.dataId.startsWith('temp') ? null : opt.dataId;

			fieldInfo.setting.options.push({ dataId: optId, id: opt.label.replace(/ /g, '_'), value: opt.label });

			fieldInfo.setting.filter_options.push(opt.label);
		});

		// Filter value is not empty
		fieldInfo.setting.filter_options = $.grep(fieldInfo.setting.filter_options, function (name) { return name && name.length > 0; });
		fieldInfo.setting.options = $.grep(fieldInfo.setting.options, function (opt) { return opt && opt.value && opt.value.length > 0; });

		if (fieldInfo.setting.options.length < 1) {
			webix.alert({
				title: "Option required",
				text: "Enter at least one option.",
				ok: "Ok"
			})

			return null;
		}

		if (removedOptionIds && removedOptionIds.length > 0)
			fieldInfo.removedOptionIds = removedOptionIds;

		return fieldInfo;
	};

	// Reset state
	listDataField.resetState = function () {
		$$(componentIds.listOptions).editCancel();
		$$(componentIds.listOptions).unselectAll();
		$$(componentIds.listOptions).clearAll();

		removedOptionIds = [];
	};

	return listDataField;

});