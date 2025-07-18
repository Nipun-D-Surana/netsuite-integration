/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/task', 'N/search', 'N/record', 'N/error'], function (task, search, record, error) {
    function execute(context) {
        try {
            var searchId = 'customsearch_syrup_to_item_fulfillment'; // Saved Search Id which will export products

            var savedSearch = search.load({ id: searchId });

            // Run the search
            var searchResult = savedSearch.run().getRange({ start: 0, end: 1 });

            // If the search returned no results, do not create the CSV file
            if (searchResult.length === 0) {
                log.debug('No results found. Skipping CSV file creation.');
                return;
            }

            var searchTask = task.create({
                taskType: task.TaskType.SEARCH
            });

            searchTask.savedSearchId = searchId;

            // Check Export Syrup Integration CSV Folder is created or not 
            var folderInternalId = search
                .create({
                    type: search.Type.FOLDER,
                    filters: [['name', 'is', 'Export Syrup Integration CSV']],
                    columns: ['internalid']
                })
                .run()
                .getRange({ start: 0, end: 1 })
                .map(function (result) {
                    return result.getValue('internalid');
                })[0];

            // Made Export Syrup Integration CSV folder in NetSuite File Cabinet
            if (folderInternalId == null) {
                var folder = record.create({ type: record.Type.FOLDER });
                folder.setValue({
                    fieldId: 'name',
                    value: 'Export Syrup Integration CSV'
                });
                var folderId = folder.save();
            }

            var date = new Date();

            var formattedDate = date.getFullYear().toString() +
                String(date.getMonth() + 1).padStart(2, '0') +
                String(date.getDate()).padStart(2, '0') + '_' +
                String(date.getHours()).padStart(2, '0') +
                String(date.getMinutes()).padStart(2, '0') +
                String(date.getSeconds()).padStart(2, '0');
            var fileName = 'transfer_order_item_fulfillment_' + formattedDate + '.csv';
            var path = 'Export Syrup Integration CSV/' + fileName;
            searchTask.filePath = path;

            var searchTaskId = searchTask.submit();

            var taskStatus = task.checkStatus(searchTaskId);

            log.debug("Search task is submitted ! " + taskStatus.status);
            log.debug("Export Syrup Integration CSV file Successfully Uploaded in NetSuite with file name ! " + fileName);
        } catch (e) {
            log.error({
                title: 'Error in generating Export Syrup Integration CSV files',
                details: e,
            });
            throw error.create({
                name: "Error in generating Export Syrup Integration CSV files",
                message: e
            });
        }
    }
    return {
        execute: execute
    };
});