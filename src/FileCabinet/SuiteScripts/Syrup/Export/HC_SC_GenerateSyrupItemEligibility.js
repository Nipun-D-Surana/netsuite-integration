/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/task', 'N/search', 'N/record', 'N/error', 'N/log'], function (task, search, record, error, log) {

    function execute(context) {
        try {
            var date = new Date();
            var searchIds = [
                { id: 'customsearch6280', name: 'Eligibility_replenish' },
                { id: 'customsearch6281', name: 'Eligibility_replenish' },
                { id: 'customsearch6272', name: 'Eligibility_replenish' },
                { id: 'customsearch6273', name: 'Eligibility_replenish' },
                { id: 'customsearch6274', name: 'Eligibility_replenish' },
                { id: 'customsearch6275', name: 'Eligibility_replenish' },
                { id: 'customsearch6276', name: 'Eligibility_replenish' },
                { id: 'customsearch6277', name: 'Eligibility_replenish' },
                { id: 'customsearch6279', name: 'Eligibility_replenish' },
                { id: 'customsearch6219', name: 'Eligibility_replenish' }
                // customsearch_hc_syrup_inventory_snapshot
                // Add more saved search IDs and file name prefixes here
            ];

            // Ensure Export Product CSV folder exists
            var folderInternalId = getOrCreateFolder('Export Syrup Integration CSV');

            searchIds.forEach(function (searchItem, index) {
                var savedSearch = search.load({ id: searchItem.id });

                var searchResult = savedSearch.run().getRange({ start: 0, end: 1 });

                if (searchResult.length === 0) {
                    log.debug('No results for search: ' + searchItem.name);
                    return;
                }

                var searchTask = task.create({
                    taskType: task.TaskType.SEARCH
                });

                searchTask.savedSearchId = searchItem.id;

                // Add index or timestamp for uniqueness
                var uniqueSuffix = index;
                var fileName = searchItem.name + '_' + formatDate(date) + '_' + uniqueSuffix + '.csv';
                var path = 'Export Syrup Integration CSV/' + fileName;

                searchTask.filePath = path;

                var searchTaskId = searchTask.submit();

                var taskStatus = task.checkStatus(searchTaskId);

                log.debug("Submitted search: " + searchItem.name + ", Task status: " + taskStatus.status);
                log.debug("CSV file uploaded: " + fileName);
            });

        } catch (e) {
            log.error({
                title: 'Error in generating export product csv files',
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