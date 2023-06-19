<div class="page-header">{{{header}}}</div>
<div class="search-container">{{{search}}}</div>

<div class="row email-combined {{#if isCombinedMode}}is-combined{{/if}}">
    {{#unless foldersDisabled}}
        <div class="left-container {{#if isCombinedMode}}col-md-2 col-sm-3{{else}}col-md-2 col-sm-3{{/if}}">
            <div class="folders-container">{{{folders}}}</div>
        </div>
    {{/unless}}
    <div class="list-container {{#if isCombinedMode}}col-sm-3{{else}}{{#unless
        foldersDisabled}}col-md-10 col-sm-9{{else}}col-md-12{{/unless}}{{/if}}">
        <div class="email-list-container">
            {{{list}}}
        </div>
    </div>
    {{#if isCombinedMode}}
        <div class="detail-container{{#unless foldersDisabled}} col-sm-7{{else}} col-sm-8{{/unless}}">
            {{{combinedDetail}}}
        </div>
    {{/if}}
</div>
