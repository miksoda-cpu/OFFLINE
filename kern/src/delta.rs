//! Delta zwischen zwei Manifesten: was ein Update laden und löschen muss.

use crate::manifest::Manifest;
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Laden {
    pub pfad: String,
    pub bytes: u64,
    /// Indizes der zu ladenden Teile; leer = ganze Datei
    pub teile: Vec<usize>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Delta {
    pub laden: Vec<Laden>,
    pub loeschen: Vec<String>,
    pub bytes: u64,
    pub gesamt: u64,
}

pub fn delta(alt: Option<&Manifest>, neu: &Manifest) -> Delta {
    let vorher: HashMap<&str, _> = alt.map(|a| a.dateien.iter().map(|d| (d.pfad.as_str(), d)).collect()).unwrap_or_default();
    let mut laden = Vec::new();
    let mut bytes = 0u64;
    for d in &neu.dateien {
        let a = vorher.get(d.pfad.as_str()).copied();
        if let Some(a) = a {
            if a.sha256 == d.sha256 {
                continue;
            }
        }
        let teilweise = match (a, &d.teile, d.teilgroesse) {
            (Some(a), Some(nt), Some(tg)) if a.teilgroesse == Some(tg) => a.teile.as_ref().map(|at| {
                let idx: Vec<usize> = nt.iter().enumerate().filter(|(i, t)| at.get(*i) != Some(t)).map(|(i, _)| i).collect();
                let b = idx.iter().map(|&i| tg.min(d.groesse - i as u64 * tg)).sum::<u64>();
                (idx, b)
            }),
            _ => None,
        };
        match teilweise {
            Some((teile, b)) => {
                bytes += b;
                laden.push(Laden { pfad: d.pfad.clone(), bytes: b, teile });
            }
            None => {
                bytes += d.groesse;
                laden.push(Laden { pfad: d.pfad.clone(), bytes: d.groesse, teile: vec![] });
            }
        }
    }
    let nachher: HashSet<&str> = neu.dateien.iter().map(|d| d.pfad.as_str()).collect();
    let loeschen = alt
        .map(|a| a.dateien.iter().filter(|d| !nachher.contains(d.pfad.as_str())).map(|d| d.pfad.clone()).collect())
        .unwrap_or_default();
    Delta { laden, loeschen, bytes, gesamt: neu.groesse }
}
