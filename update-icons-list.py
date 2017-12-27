#!/usr/bin/python3
# -*- coding: utf-8 -*-

import os
import re
import urllib.request
import json
import zipfile
import shutil
from operator import itemgetter

fa_upstream_uri = 'https://github.com/FortAwesome/Font-Awesome/archive/master.zip'
fa_workspace = 'temp'
fa_files = [
    'css/font-awesome.css',
    'css/font-awesome.css.map',
    'css/font-awesome.min.css',
    'fonts/fontawesome-webfont.woff2'
]

meta_output_file = 'dist/data/icons.json'
meta_output_file_min = 'dist/data/icons.min.json'


def download_and_extract(url):
    if not os.path.isdir(fa_workspace):
        os.makedirs(fa_workspace)

    master_filename = os.path.join(fa_workspace, 'master.zip')
    print('Downloading {} into {}'.format(url, master_filename))

    urllib.request.urlretrieve(url, master_filename)

    with open(master_filename, 'rb') as file_handle:
        master_zip = zipfile.ZipFile(file_handle)
        master_zip.extractall(fa_workspace)


def download_css_and_fonts():
    # download main repo content
    download_and_extract(fa_upstream_uri)

    # copy only certain files
    for file in fa_files:
        zip_file = os.path.join(fa_workspace, 'Font-Awesome-master', file)
        output_file = os.path.join('dist/', file)

        shutil.copyfile(zip_file, output_file)

        print('Extracted {}'.format(file))

    # cleanup
    shutil.rmtree(fa_workspace)


def parse_file():
    with open('dist/css/font-awesome.min.css', 'r') as fh:
        raw_css = fh.read().replace('\n', '')

    version = re.findall('Font Awesome ((?:\d+\.?)+)', raw_css)[0]

    # Find all selectors groups
    icons = []
    for icon in re.findall('((?:\.fa-[a-z-\d]+:before,?)+){content:\"\\\\(f[0-9a-fA-F]+)\"}', raw_css):
        selectors = icon[0]
        codepoint = icon[1]
        main_selector = None
        searchable = []

        # Split the selectors
        for selector in re.findall('\.fa-([a-z-\d]+):before', selectors):
            main_selector = selector
            searchable.append(
                main_selector
                    .replace('fa', '')
                    .replace('-', ' ')
            )

        str_searchable = ' '.join(searchable)

        # Remove duplicates
        searchable = str_searchable.split()
        str_searchable = ' '.join(sorted(set(searchable), key=searchable.index))

        icons.append({
            'name': main_selector,
            'codepoint': codepoint,
            'searchable': str_searchable
        })

    # Sort icons alphabetically
    icons = sorted(icons, key=itemgetter('name'))

    return {
        'icons': icons,
        'version': version,
    }


def write_json_to_file(data, file, pretty):
    with open(file, 'w') as output:
        output.truncate()

        raw_json = json.dumps(data, sort_keys=True, indent=4 if pretty else None)
        output.writelines(raw_json)
        output.writelines("\n")

        print("Written {}".format(file))


# Download CSS & fonts
download_css_and_fonts()

print('')

# Download & write meta data to files
meta = parse_file()
print("Found {} icons".format(len(meta['icons'])))
write_json_to_file(meta, meta_output_file, True)
write_json_to_file(meta, meta_output_file_min, False)
