steal(
	// List your Controller's dependencies here:
	'opstools/BuildApp/controllers/utils/ModelCreator.js',
	'opstools/BuildApp/controllers/utils/DataHelper.js',

	'OpsPortal/classes/OpsWebixDataCollection.js',

	function (modelCreator, dataHelper) {
		var dataCollections = {};

		return {
			getDataCollection: function (application, objectId) {
				var self = this,
					q = $.Deferred();

				if (!objectId) {
					q.reject("Object id is required.");
					return q;
				}

				if (!dataCollections[objectId]) {
					// Get object info
					var objInfo = application.objects.filter(function (obj) { return obj.id == objectId });

					if (!objInfo || objInfo.length < 1) {
						q.reject('System could not found this object.');
						return q;
					}

					objInfo = objInfo[0];

					// Get object model
					var objectModel = modelCreator.getModel(application, objInfo.attr('name')),
						objectData,
						linkCols = objInfo.columns.filter(function (col) { return col.setting.linkObject }) || [], // Get link columns
						dateCols = objInfo.columns.filter(function (col) { return col.setting.editor === 'date' || col.setting.editor === 'datetime'; }) || [];// Get date & datetime columns

					async.series([
						// Find data
						function (next) {
							objectModel.findAll({})
								.fail(next)
								.then(function (data) {
									objectData = data;
									next();
								});
						},
						// Populate labels & Convert string to Date object
						function (next) {
							if (!objectData) return next();

							dataHelper.normalizeData(application, objectData, linkCols, dateCols)
								.fail(next)
								.then(function (result) {
									if (!dataCollections[objectId]) {
										dataCollections[objectId] = AD.op.WebixDataCollection(result);

										// Listen change data event to update data label
										dataCollections[objectId].AD.__list.bind('change', function (ev, attr, how, newVal, oldVal) {
											var attName = attr.indexOf('.') > -1 ? attr.split('.')[1] : attr, // 0.attrName
												hasUpdateLink = linkCols.filter(function (col) { return col.name == attName; }).length > 0,
												hasUpdateDate = dateCols.filter(function (col) { return col.name == attName; }).length > 0;

											if ((hasUpdateLink || hasUpdateDate) && newVal) {
												// Update connected data
												dataHelper.normalizeData(application, ev.target, linkCols, dateCols).then(function (result) { });
											}
										});
									}

									next();
								});
						}
					], function (err) {
						if (err) {
							q.reject(err);
							return;
						}

						q.resolve(dataCollections[objectId]);
					});
				}
				else {
					q.resolve(dataCollections[objectId]);
				}

				return q;
			}
		};

	}
);