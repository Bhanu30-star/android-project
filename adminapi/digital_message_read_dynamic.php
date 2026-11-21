<?php 
include("../../connect.php"); 
if(isset($_POST['type']) && isset($_POST['distributor_id']))
{
    $distributor_id=$_POST['distributor_id'];
    $jsonData=$_POST['type'];
	$msg_txn_detail=array();
    $check= mysqli_query($con,"SELECT * FROM `tbl_digital_message_read_dynamic`");
    if(mysqli_num_rows($check)>0)
	{
		while($fetch_operator=mysqli_fetch_assoc($check))
		{
			$msg_txn_detail['id'] = $fetch_operator['id'];
			$msg_txn_detail['operator'] = $fetch_operator['operator'];
			$msg_txn_detail['message_type'] = $fetch_operator['message_type'];
			$msg_txn_detail['message_check'] = $fetch_operator['message_check'];
			$msg_txn_detail['index1'] = $fetch_operator['index1'];
			$msg_txn_detail['index1_val'] = $fetch_operator['index1_val'];
			$msg_txn_detail['index2'] = $fetch_operator['index2'];
			$msg_txn_detail['index2_val'] = $fetch_operator['index2_val'];
			$msg_txn_detail['index3'] = $fetch_operator['index3'];
			$msg_txn_detail['index3_val'] = $fetch_operator['index3_val'];
			$msg_txn_detail['regex'] = json_decode($fetch_operator['regex']);
			$response['msg_txn_detail'][]=$msg_txn_detail;
		}
			
        $response["success"]=1;
        $response['message']="Data inserted successfully !!";
        
	}
	else
	{
         $response["success"]=0;
         $response["message"]=" This transfer already exists";
    }
}
else
{
    $response["status"]=0;
    $response["message"]="Required feild missing";
}          
echo json_encode($response);
 ?>