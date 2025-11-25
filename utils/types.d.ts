export type Experiment = {
  experiment_accession: string;
  experiment_title: string;
  sample_taxon_id: string;
  sample_scientific_name: string;
  experiment_library_strategy: string;
  experiment_library_source: string;
  experiment_library_selection: string;
  sample_accession: string;
  sample_alias: string;
  experiment_instrument_model: string;
  pool_member_spots: string;
  run_1_size: string;
  run_1_accession: string;
  run_1_total_spots: string;
  run_1_total_bases: string;
  study_title: string?;
};

export type SearchResults = Record<string, Experiment[]>;
