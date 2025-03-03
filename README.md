# Enhanced Security DNS Filter

Blocks ads, trackers, malware, and online threats with optimized DNS-level filtering.

### How to build DNS filter manually

```
yarn install
yarn run build
```

The output is written to `Filters/filter.txt`.

## DNS filter structure

### Ad servers

#### These filter lists block domains that are used to provide and show advertisements on websites

* [oisd small](https://small.oisd.nl)
* [AdGuard Mobile Ads filter](https://github.com/AdguardTeam/AdguardFilters/tree/master/SpywareFilter/sections)
* [Online Malicious URL Blocklist](https://malware-filter.gitlab.io/malware-filter/urlhaus-filter-agh-online.txt)
* [ABPindo ad servers](https://raw.githubusercontent.com/ABPindo/indonesianadblockrules/master/src/advert/adservers.txt)
* [ABPindo ad servers third-party](https://raw.githubusercontent.com/ABPindo/indonesianadblockrules/master/src/advert/thirdparty.txt)
* [HaGeZi's Fake DNS Blocklist](https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/fake-onlydomains.txt)
* [BebasDNS's Custom Filtering](https://raw.githubusercontent.com/bebasid/bebasdns/main/dev/resources/hosts/custom-filtering-rules-blocklist)
* [Additional rules](https://github.com/AdguardTeam/AdGuardSDNSFilter/raw/refs/heads/master/Filters/rules.txt)
* [Exception rules](https://github.com/AdguardTeam/AdGuardSDNSFilter/raw/refs/heads/master/Filters/exceptions.txt)

## Transformations

The following transformations are applied to the filter lists:

* Deduplicate
* RemoveEmptyLines
* Validate
* RemoveComments
* RemoveModifiers
* TrimLines
* Compress

## Exclusions

The following exclusions are applied:

* [Exclusion rules](https://github.com/AdguardTeam/AdGuardSDNSFilter/raw/refs/heads/master/Filters/exclusions.txt)
