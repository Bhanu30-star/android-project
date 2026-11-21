<?php 
$response = array();
include("../../connect.php"); 
if(isset($_POST['message_json']) && isset($_POST['distributor_id']))
{
	$distributor_id=$_POST['distributor_id'];
    $jsonData=$_POST['message_json'];
    $array_json=json_decode($jsonData,true);
    foreach ($array_json as $row) 
	{
        $txn_id=$row['txn_id'];
        $quantity=$row['quantity'];
        $amount=$row['amount'];
        $msg_date=$row['message_date'];
        $retailer_no=$row['retailer_no'];
        $check= mysqli_query($con,"SELECT * FROM `tbl_client_auto_sync_message_detail` WHERE message_txn_id='$txn_id' and type_detail='Sale' and message_type='Digital Transfer' and distributor_id='$distributor_id'");
        if(mysqli_num_rows($check)==0)
		{
            $query=mysqli_query($con,"INSERT INTO `tbl_client_auto_sync_message_detail`(`distributor_id`, `type_detail`, `message_type`, `message_date`, `quantity`, `amount`, `message_txn_id`, `retailer_phone`) VALUES ('$distributor_id','Sale','Digital Transfer','$msg_date','$quantity','$amount','$txn_id','$retailer_no')");
		}
	}
	$response["success"]=1;
    $response['details']="Data inserted successfully !!";
}
else
{
   $response["status"]=0;
   $response["details"]="Required feild missing";
}
echo json_encode($response);
?>