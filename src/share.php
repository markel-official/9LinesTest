<?php



// Проверяем установлен ли массив файлов и массив с переданными данными
if(isset($_POST) && isset($_POST['image'])) {
 
    $fileName = 'preview';
    //Переданный массив сохраняем в переменной
    $image = $_POST['image'];

    // $imageFullName = './images/preview.' . $imageFormat;

    if (move_uploaded_file($image['tmp_name'], $image)) {
        echo 'success';
    } else {
        echo 'error';
    }
   
   
    // Достаем формат изображения
    // $imageFormat = explode('.', $image['name']);
    // $imageFormat = $imageFormat[1];
   
    // // Генерируем новое имя для изображения. Можно сохранить и со старым
    // // но это не рекомендуется делать
    // $imageFullName = './images/preview.' . $imageFormat;
   
    // // Сохраняем тип изображения в переменную
    // $imageType = $image['type'];
   
    // Сверяем доступные форматы изображений, если изображение соответствует,
    // копируем изображение в папку images
    // if ($imageType == 'image/jpeg' || $imageType == 'image/png') {
      
    // }
}
