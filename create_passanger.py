#!/usr/bin/python
# -*- coding: utf-8 -*-
import sys
import os
import glob
import csv, codecs, cStringIO
import json

class UTF8Recoder:
    """
    Iterator that reads an encoded stream and reencodes the input to UTF-8
    """
    def __init__(self, f, encoding):
        self.reader = codecs.getreader(encoding)(f)

    def __iter__(self):
        return self

    def next(self):
        return self.reader.next().encode("utf-8")

class UnicodeReader:
    """
    A CSV reader which will iterate over lines in the CSV file "f",
    which is encoded in the given encoding.
    """

    def __init__(self, f, dialect=csv.excel, encoding="utf-8", **kwds):
        f = UTF8Recoder(f, encoding)
        self.reader = csv.reader(f, dialect=dialect, **kwds)

    def next(self):
        row = self.reader.next()
        return [unicode(s, "utf-8") for s in row]

    def __iter__(self):
        return self


class UnicodeWriter:
    """
    A CSV writer which will write rows to CSV file "f",
    which is encoded in the given encoding.
    """

    def __init__(self, f, dialect=csv.excel, encoding="utf-8", **kwds):
        # Redirect output to a queue
        self.queue = cStringIO.StringIO()
        self.writer = csv.writer(self.queue, dialect=dialect, **kwds)
        self.stream = f
        self.encoder = codecs.getincrementalencoder(encoding)()

    def writerow(self, row):
        self.writer.writerow([s.encode("utf-8") for s in row])
        # Fetch UTF-8 output from the queue ...
        data = self.queue.getvalue()
        data = data.decode("utf-8")
        # ... and reencode it into the target encoding
        data = self.encoder.encode(data)
        # write to the target stream
        self.stream.write(data)
        # empty queue
        self.queue.truncate(0)

    def writerows(self, rows):
        for row in rows:
            self.writerow(row)


def analyze_year_row(row):
    ret = {}
    type = [
      'commuterPass',
      'other',
      'sum',
      'yearOnYear'
    ]
    pre_year = 0
    ix = 0
    for i in range(len(row)):
        if i >= 2:
            if pre_year != row[i]:
                ix = 0
            ret[i] = (row[i], type[ix])
            pre_year = row[i]
            ix = ix + 1
    return ret


def main(argvs, argc):
    if argc != 3:
        print ("Usage #python %s search_str outputpath" % argvs[0])
        print ("search_str: data\\*.csv")
        return 1
    search_str = argvs[1]
    output_path = argvs[2]
    output_buff = []
    output_buff.append([
        'year', 
        'line', 
        'station',
        'type',
        'count'
    ])
    for f in glob.glob(search_str):
        with open(f , 'rb') as csvfile:
            reader = UnicodeReader(csvfile, encoding='cp932')
            rowcnt = 0
            header = {}
            for row in reader:
                rowcnt = rowcnt + 1
                if rowcnt == 1:
                    # 年が入っている
                    header = analyze_year_row(row)
                elif rowcnt == 2:
                    # 表題なのでスキップ
                    continue
                else:
                    data = {}
                    if (row[0].strip() + u'計') == row[1].strip():
                        continue
                    for i in range(len(row)):
                        if i < 2:
                            continue
                        if not header[i][0] in data:
                            data[header[i][0]] = {}
                        data[header[i][0]][header[i][1]] = row[i].replace(',', '')
                    for k, item in data.items():
                        output_buff.append([
                          k.strip() , row[0].strip() , row[1].strip() , u'定期', item['commuterPass'].strip()
                        ])
                        output_buff.append([
                          k.strip() , row[0].strip() , row[1].strip() , u'定期外', item['other'].strip()
                        ])
    with open(output_path, 'wb') as fout:
        writer = UnicodeWriter(fout,quoting=csv.QUOTE_ALL)
        for b in output_buff:
              writer.writerow(b)
    #print json.dumps(output_buff)
    #with open(output_path, 'w') as f:
    #    json.dump(output_json, f, sort_keys=True, indent=4, encoding='utf-8')

if __name__ == '__main__':
    argvs = sys.argv
    argc = len(argvs)
    sys.exit(main(argvs, argc))
