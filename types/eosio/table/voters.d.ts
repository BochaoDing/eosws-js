// Generated by https://quicktype.io
//
// To change quicktype's target language, run command:
//
//   "Set quicktype target language"

export interface Voters {
    owner:               string;
    proxy:               string;
    producers:           string[];
    staked:              number;
    last_vote_weight:    string;
    proxied_vote_weight: string;
    is_proxy:            number;
}
