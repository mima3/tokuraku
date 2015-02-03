とくらぐらふ
==========
「とくらぐらふ」では、「とくらくからの提供データ」を用いて様々なグラフを描画します。  
記述したグラフに様々なフィルタを動的に付与して、様々な「気づき」を発見することができます。  

http://needtec.sakura.ne.jp/tokuraku/

依存するプロジェクト
-------------
とくらぐらふを動作させるには次のプログラムがWebサーバー上で動作している必要があります。  

政府統計の実験プログラム  
https://github.com/mima3/estat  

国土数値情報の取得プログラム  
https://github.com/mima3/kokudo  


「とくらくからの提供データ」からの変換用スクリプト
-------------
「とくらくからの提供データ」の乗降人員をpassanger.csvに変換する  

    python create_passanger.py data\2005_2013\*.csv data\passanger.csv

「とくらくからの提供データ」のイベント情報をevent.jsonに変換する  

    python create_event_json.py data\export_event.xml data\event.json

ライセンス
-------------
当方が作成したコードに関してはMITとします。  
その他、jqueryなどに関しては、それぞれにライセンスを参照してください。

    The MIT License (MIT)

    Copyright (c) 2015 m.ita

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
    FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
    COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
    IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

