<?php

if ($_SERVER["REQUEST_METHOD"] === "POST") {
	header('Access-Control-Allow-Origin: *');
	$host = $_POST["host"];
	$method = $_POST["method"];
	$param = json_decode($_POST["param"]);
	$ch = curl_init(); 
	curl_setopt($ch, CURLOPT_URL, $host);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER , true);
	echo $response = curl_exec($ch);
	curl_close($ch);
}