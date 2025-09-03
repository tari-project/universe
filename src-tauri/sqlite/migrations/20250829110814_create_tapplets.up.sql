CREATE TABLE tapplet (
  id INTEGER PRIMARY KEY,
  package_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  background_url TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_website TEXT NOT NULL,
  about_summary TEXT NOT NULL,
  about_description TEXT NOT NULL,
  category TEXT NOT NULL,
  UNIQUE(package_name)
);

CREATE TABLE tapplet_version (
  id INTEGER PRIMARY KEY,
  tapplet_id INTEGER,
  version TEXT NOT NULL,
  integrity TEXT NOT NULL,
  registry_url TEXT NOT NULL,
  UNIQUE(tapplet_id, version),
  FOREIGN KEY (tapplet_id) REFERENCES tapplet(id)
);

CREATE TABLE tapplet_audit (
  id INTEGER PRIMARY KEY,
  tapplet_id INTEGER,
  auditor TEXT NOT NULL,
  report_url TEXT NOT NULL,
  UNIQUE(tapplet_id, auditor),
  FOREIGN KEY (tapplet_id) REFERENCES tapplet(id)
);

CREATE TABLE installed_tapplet (
  id INTEGER PRIMARY KEY,
  tapplet_id INTEGER,
  tapplet_version_id INTEGER,
  source TEXT NOT NULL,
  csp TEXT NOT NULL,
  tari_permissions TEXT NOT NULL,
  UNIQUE(tapplet_id, tapplet_version_id, source),
  FOREIGN KEY (tapplet_id) REFERENCES tapplet(id),
  FOREIGN KEY (tapplet_version_id) REFERENCES tapplet_version(id)
);

CREATE TABLE dev_tapplet (
  id INTEGER PRIMARY KEY,
  package_name TEXT NOT NULL,
  source TEXT NOT NULL,
  display_name TEXT NOT NULL,
  csp TEXT NOT NULL,
  tari_permissions TEXT NOT NULL,
  UNIQUE(source)
);

CREATE TABLE tapplet_asset (
  id INTEGER PRIMARY KEY,
  tapplet_id INTEGER,
  icon_url TEXT NOT NULL,
  background_url TEXT NOT NULL,
  FOREIGN KEY (tapplet_id) REFERENCES tapplet(id)
);
