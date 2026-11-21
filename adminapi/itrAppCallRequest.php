<?php

include("../../connect.php");

$method = $_SERVER['REQUEST_METHOD'];
$todayDate = date('d');
if ($method == 'POST') {
  if (empty($_REQUEST)) {
    echo json_encode(['result' => false, 'msg' => 'Parameter Missing', 'data' => null]);
  } 
  else if(!empty($_REQUEST) && $_REQUEST['client_id'] != '' &&  $_REQUEST['fy'] != '' && $_REQUEST['doc_name'] != ''){
    $client_id = $_REQUEST['client_id'];
    $fy = $_REQUEST['fy'];
    $doc_name = $_REQUEST['doc_name'];
    $insert_req = mysqli_query($con, "INSERT INTO `tbl_btcw_itr_app_call_request`(`client_id`, `fy`, `doc_name`) VALUES ('$client_id','$fy','$doc_name')");
    if (!$insert_req) {
      echo json_encode(['result' => false, 'msg' => 'Call Request Failed !']);
    }else{
      echo json_encode(['result' => true, 'msg' => 'Call Request Insert Successfully !']);
    } 
  } else if (!empty($_REQUEST) && $_REQUEST['client_id'] == '') {
    echo json_encode(['result' => false, 'msg' => 'Client Id is Missing.', 'data' => null]);
  }else if (!empty($_REQUEST) && $_REQUEST['fy'] == '') {
    echo json_encode(['result' => false, 'msg' => 'Financial Year is Missing.', 'data' => null]);
  }else if (!empty($_REQUEST) && $_REQUEST['doc_name'] == '') {
    echo json_encode(['result' => false, 'msg' => 'Document Name is Missing.', 'data' => null]);
  } 
  // else if (!empty($_REQUEST) && (array_keys($_REQUEST)[0] != 'client_id' && ($_REQUEST)[1] != 'fy' && ($_REQUEST)[2] != 'doc_name')) {
  //   echo json_encode(['result' => false, 'msg' => 'Parameter is Wrong.', 'data' => null]);
  // }
} 
else {
  echo json_encode(['result' => false, 'msg' => 'Parameter Missing.', 'data' => null]);
}

?>
