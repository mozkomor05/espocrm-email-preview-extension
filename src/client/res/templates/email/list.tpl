<div class="page-header">{{{header}}}</div>
<div class="search-container">{{{search}}}</div>

<div class="row">
    {{#unless foldersDisabled}}
    <div class="folders-container {{#if
            isCombinedMode}}col-md-1 col-sm-3{{else}}col-md-2 col-sm-3{{/if}}">{{{folders}}}</div>
    {{/unless}}
    <div class="list-container{{#unless
        foldersDisabled}} {{#if
        isCombinedMode}}col-md-4 col-sm-9{{else}}col-md-10 col-sm-9{{/if}}{{else}} col-md-12{{/unless}}">{{{list}}}</div>
    {{#if isCombinedMode}}
    <div class="detail-container{{#unless
            foldersDisabled}} col-md-7{{else}} col-md-12{{/unless}}">{{{combinedDetail}}}</div>
    {{/if}}
</div>
