define("webim-templates", [
    "tpl!webim_container",
    "tpl!chat_left_panel_top",
    "tpl!chat_left_panel_tab",
    "tpl!chat_left_panel_list",
    "tpl!chat_left_panel_footer",
    "tpl!chat_conversation_list_item",
    "tpl!chat_contact_list_item_title",
    "tpl!chat_contact_list_item_detail",
    "tpl!chat_message_container",
    "tpl!chat_message_main_panel",
    "tpl!chat_message"
    
], function () {
    return {
        webim_container:                    arguments[0],
        chat_left_panel_top:                arguments[1],
        chat_left_panel_tab:                arguments[2],
        chat_left_panel_list:               arguments[3],
        chat_left_panel_footer:             arguments[4],
        chat_conversation_list_item:        arguments[5],
        chat_contact_list_item_title:       arguments[6],
        chat_contact_list_item_detail:      arguments[7],
        chat_message_container:             arguments[8],
        chat_message_main_panel:            arguments[9],
        chat_message:                       arguments[10]
    };
});
