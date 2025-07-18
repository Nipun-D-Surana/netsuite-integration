/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/task', 'N/search', 'N/record', 'N/error', 'N/log'], function (task, search, record, error, log) {

    function execute(context) {
        try {
            var date = new Date();
            var searchList = [
                { id: 'customsearch_hc_syr_sales_transa_invoice', name: 'sales_transactions' },
                { id: 'customsearch_hc_syrup_kit_sales_transact', name: 'sales_transactions_kit' },
                { id: 'customsearch_hc_syrup_credit_memo_for_st', name: 'sales_transactions_cm' }
            ];

            var folderName = 'Export Syrup Integration CSV';
            var folderInternalId = getOrCreateFolder(folderName);

            var hasAnyData = false;

            for (var index = 0; index < searchList.length; index++) {
                var searchItem = searchList[index];
                var savedSearch = search.load({ id: searchItem.id });
                var resultCheck = savedSearch.run().getRange({ start: 0, end: 1 });

                if (resultCheck.length === 0) {
                    log.debug('No results for search: ' + searchItem.name);
                    continue;
                }

                hasAnyData = true;

                var searchTask = task.create({
                    taskType: task.TaskType.SEARCH
                });

                searchTask.savedSearchId = searchItem.id;

                var fileName = searchItem.name + '_' + formatDate(date) + '.csv';
                var path = folderName + '/' + fileName;
                searchTask.filePath = path;

                var searchTaskId = searchTask.submit();
                var taskStatus = task.checkStatus(searchTaskId);

                log.debug("Submitted search: " + searchItem.name + ", Task status: " + taskStatus.status);
                log.debug("CSV file uploaded: " + fileName);
            }

            if (!hasAnyData) {
                log.debug("No saved searches returned results. No CSV files generated.");
                return;
            }

        } catch (e) {
            log.error({
                title: 'Error generating Export Syrup Integration CSV files',
                details: e,
            });
            throw error.create({
                name: "EXPORT_CSV_ERROR",
                message: e.message
            });
        }
    }

    function getOrCreateFolder(folderName) {
        var folderSearch = search.create({
            type: search.Type.FOLDER,
            filters: [['name', 'is', folderName]],
            columns: ['internalid']
        });

        var folderId = folderSearch.run().getRange({ start: 0, end: 1 })
            .map(function (result) {
                return result.getValue('internalid');
            })[0];

        if (!folderId) {
            var folder = record.create({ type: record.Type.FOLDER });
            folder.setValue({ fieldId: 'name', value: folderName });
            folderId = folder.save();
            log.debug('Created folder: ' + folderName);
        }
        return folderId;
    }

    function formatDate(date) {
        return date.getFullYear().toString() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0') + '_' +
            String(date.getHours()).padStart(2, '0') +
            String(date.getMinutes()).padStart(2, '0') +
            String(date.getSeconds()).padStart(2, '0');
    }

    return {
        execute: execute
    };
});