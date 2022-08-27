<div class="page-header">{{{header}}}</div>
<div class="search-container">{{{search}}}</div>

<div class="row">
    {{#unless foldersDisabled}}
    <div class="folders-container {{#if
            isCombinedMode}}col-md-1 col-sm-3{{else}}col-md-2 col-sm-3{{/if}}">{{{folders}}}</div>
    {{/unless}}
    <div class="list-container {{#if
        isCombinedMode}}col-sm-4{{else}}{{#unless
        foldersDisabled}}col-md-10 col-sm-9{{else}}col-md-12{{/unless}}{{/if}}">{{{list}}}</div>
    {{#if isCombinedMode}}
    <div class="detail-container{{#unless
            foldersDisabled}} col-sm-7{{else}} col-sm-8{{/unless}}">{{{combinedDetail}}}</div>
    {{/if}}
</div>
