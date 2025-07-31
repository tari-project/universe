// @generated automatically by Diesel CLI.

diesel::table! {
    dev_tapplet (id) {
        id -> Nullable<Integer>,
        package_name -> Text,
        endpoint -> Text,
        display_name -> Text,
    }
}

diesel::table! {
    installed_tapplet (id) {
        id -> Nullable<Integer>,
        tapplet_id -> Nullable<Integer>,
        tapplet_version_id -> Nullable<Integer>,
    }
}

diesel::table! {
    tapplet (id) {
        id -> Nullable<Integer>,
        registry_id -> Text,
        package_name -> Text,
        display_name -> Text,
        logo_url -> Text,
        background_url -> Text,
        author_name -> Text,
        author_website -> Text,
        about_summary -> Text,
        about_description -> Text,
        category -> Text,
    }
}

diesel::table! {
    tapplet_asset (id) {
        id -> Nullable<Integer>,
        tapplet_id -> Nullable<Integer>,
        icon_url -> Text,
        background_url -> Text,
    }
}

diesel::table! {
    tapplet_audit (id) {
        id -> Nullable<Integer>,
        tapplet_id -> Nullable<Integer>,
        auditor -> Text,
        report_url -> Text,
    }
}

diesel::table! {
    tapplet_version (id) {
        id -> Nullable<Integer>,
        tapplet_id -> Nullable<Integer>,
        version -> Text,
        integrity -> Text,
        registry_url -> Text,
    }
}

diesel::joinable!(installed_tapplet -> tapplet (tapplet_id));
diesel::joinable!(installed_tapplet -> tapplet_version (tapplet_version_id));
diesel::joinable!(tapplet_asset -> tapplet (tapplet_id));
diesel::joinable!(tapplet_audit -> tapplet (tapplet_id));
diesel::joinable!(tapplet_version -> tapplet (tapplet_id));

diesel::allow_tables_to_appear_in_same_query!(
    dev_tapplet,
    installed_tapplet,
    tapplet,
    tapplet_asset,
    tapplet_audit,
    tapplet_version,
);
