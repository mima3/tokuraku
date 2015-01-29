#!/usr/bin/python
# -*- coding: utf-8 -*-
import sys
import os
import json
from lxml import etree


def main(argvs, argc):
    if argc != 3:
        print ("Usage #python %s xml outputpath" % argvs[0])
        return 1
    input_xml = argvs[1]
    output_path = argvs[2]
    context = etree.iterparse(
        input_xml,
        events=('end',),
        tag='event',
        recover=True
    )
    buff = []
    for e, event in context:
        item = {}
        item['id'] = 'id' + event.find('id').text
        item['name'] = event.find('name').text
        item['start_date'] = event.find('start_date').text
        item['end_date'] = event.find('start_date').text
        item['holiday_remarks'] = event.find('holiday_remarks').text
        #item['body'] = event.find('body').text
        item['official_url'] = event.find('official_url').text

        item['place_free'] = event.find('place_free').text
        item['place_latitude'] = event.find('place_latitude').text
        item['place_longitude'] = event.find('place_longitude').text

        item['category'] = []
        for category in event.xpath('./category_list/category'):
            item['category'].append(category.text)

        #item['holiday'] = []
        #for holiday in event.xpath('./holiday_list/holiday'):
        #    item['holiday'].append(holiday.text)

        item['image'] = event.find('image1_url').text

        item['station'] = []
        for station in event.xpath('./station_list/station'):
            item['station'].append({
                'name' : station.find('name').text,
                'station_url' : station.find('station_url').text
            })
        buff.append(item)

    with open(output_path, 'w') as f:
        json.dump(buff, f, sort_keys=True, indent=4, encoding='utf-8')


if __name__ == '__main__':
    argvs = sys.argv
    argc = len(argvs)
    sys.exit(main(argvs, argc))
