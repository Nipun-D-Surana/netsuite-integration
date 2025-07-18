/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/task', 'N/search', 'N/record', 'N/error', 'N/format'], function (task, search, record, error, format) {
    function execute(context) {
        try {

            // var now = format.format({ value: new Date(), type: format.Type.DATETIME });

            // var nowDateParts = now.split(' ');

            // var datePart = nowDateParts[0];
            // var timePart = nowDateParts[1];
            // var ampmPart = nowDateParts[2];

            // // Remove the seconds from the time part
            // var timeWithoutSeconds = timePart.split(':').slice(0, 2).join(':');

            // var dateStringWithoutSeconds = datePart + ' ' + timeWithoutSeconds + ' ' + ampmPart;

            // // get last sales order payment export runtime
            // var customRecordSearch = search.create({
            //     type: 'customrecord_hc_last_runtime_export',
            //     columns: ['custrecord_syrup_purchase_ord_exp_date']
            // });

            // var searchResults = customRecordSearch.run().getRange({
            //     start: 0,
            //     end: 1
            // });

            // var searchResult = searchResults[0];
            // var lastExportDate = searchResult.getValue({
            //     name: 'custrecord_syrup_purchase_ord_exp_date'
            // });

            // var lastExportDateParts = lastExportDate.split(' ');
            // var lastExportDatePart = lastExportDateParts[0];
            // var lastExportTimePart = lastExportDateParts[1];
            // var ampmExportPart = lastExportDateParts[2];

            // // Remove the seconds from the time part
            // var lastExportTimeWithoutSeconds = lastExportTimePart.split(':').slice(0, 2).join(':');

            // var lastExportDateString = lastExportDatePart + ' ' + lastExportTimeWithoutSeconds + ' ' + ampmExportPart;

            // Get sales order payment search query
            var syrupPurchaseOrderItemSearchId = search.load({ id: 'customsearch_hc_syrup_purchase_orders' });

            // var defaultFilters = syrupPurchaseOrderItemSearchId.filters;

            // // Push the customFilters into defaultFilters.

            // defaultFilters.push(search.createFilter({
            //     name: "lastmodifieddate",
            //     operator: search.Operator.WITHIN,
            //     values: lastExportDateString, dateStringWithoutSeconds
            // }));
            // // Copy the modified defaultFilters
            // syrupPurchaseOrderItemSearchId.filters = defaultFilters;

            // Run the search
            var searchResult = syrupPurchaseOrderItemSearchId.run().getRange({ start: 0, end: 1 });

            // If the search returned no results, do not create the CSV file
            if (searchResult.length === 0) {
                log.debug('No results found. Skipping CSV file creation.');
                return;
            }

            var searchTask = task.create({
                taskType: task.TaskType.SEARCH
            });

            searchTask.savedSearchId = syrupPurchaseOrderItemSearchId.id;;

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
            var fileName = 'purchase_orders_' + formattedDate + '.csv';
            var path = 'Export Syrup Integration CSV/' + fileName;
            searchTask.filePath = path;

            var searchTaskId = searchTask.submit();

            var taskStatus = task.checkStatus(searchTaskId);

            log.debug("Search task is submitted ! " + taskStatus.status);
            log.debug("Export Syrup Integration CSV file Successfully Uploaded in NetSuite with file name ! " + fileName);

            // now date is variable is define in above line
            // var currentDate = now;

            // //Get Custom Record Type internal id
            // var customRecordHCExSearch = search.create({
            //     type: 'customrecord_hc_last_runtime_export',
            //     columns: ['internalid']
            // });
            // var searchResults = customRecordHCExSearch.run().getRange({
            //     start: 0,
            //     end: 1
            // });

            // var searchResult = searchResults[0];
            // var lastRuntimeExportInternalId = searchResult.getValue({
            //     name: 'internalid'
            // });

            // // save last sales order fulfillment export date
            // record.submitFields({
            //     type: 'customrecord_hc_last_runtime_export',
            //     id: lastRuntimeExportInternalId,
            //     values: {
            //         custrecord_syrup_purchase_ord_exp_date: currentDate
            //     }
            // });
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