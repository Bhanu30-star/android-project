<?php 
$response = array();
include("../../connect.php"); 
if(isset($_POST['message_json']) && isset($_POST['distributor_id']))
{
	$distributor_id=$_POST['distributor_id'];
    $jsonData=$_POST['message_json'];
	$type_detail=$_POST['type_detail'];
    $message_type=$_POST['message_type'];
	$source=$_POST['source'];
	$operator=$_POST['operator_detail'];
    $array_json=json_decode($jsonData,true);
    foreach ($array_json as $row) 
	{
        $txn_id=$row['txn_id'];
        $quantity=$row['quantity'];
        $amount=$row['amount'];
        $msg_date=$row['message_date'];
        $retailer_no=$row['retailer_no'];
        $fse_no=$row['fse_no'];
		$party_id=$row['party_id'];
		$txn_bill_no=$row['txn_bill_no'];
		
        $check= mysqli_query($con,"SELECT * FROM `tbl_client_auto_sync_message_detail` WHERE message_txn_id='$txn_id' and type_detail='$type_detail' and message_type='$message_type' and distributor_id='$distributor_id'");
        if(mysqli_num_rows($check)==0)
		{
            $query=mysqli_query($con,"INSERT INTO `tbl_client_auto_sync_message_detail`(`distributor_id`,`type_detail`,`message_type`, `message_date`, `quantity`, `amount`, `message_txn_id`, `retailer_phone`, `fse_phone`, `purchase_party_id`,`source`,`operator_detail`, `txn_bill_no`) VALUES ('$distributor_id','$type_detail', '$message_type','$msg_date','$quantity','$amount','$txn_id','$retailer_no','$fse_no','$party_id','$source','$operator','$txn_bill_no')");
        }
	}
	$response["success"]=1;
    $response['details']="Data inserted successfully !!";
}
else
{
   $response["success"]=0;
   $response["details"]="Required feild missing";
}
echo json_encode($response);
?>