<?php 
include("../../connect.php");
$response=array();
if(isset($_POST['distributor_id']))
{
    $distributor_id=$_POST['distributor_id'];
    $check= mysqli_query($con,"SELECT * FROM `tbl_client_auto_sync_message_detail` WHERE type_detail='Purchase' AND distributor_id='$distributor_id'");
    if(mysqli_num_rows($check)>0)
	{
		$data=array();
		while($row=mysqli_fetch_assoc($check))
		{
			$data['message_id']=$row['message_id'];
			$data['message_date']=$row['message_date'];
                  $data['distributor_id']=$row['distributor_id'];
                  $data['type_detail']=$row['type_detail'];
                  $data['message_type']=$row['message_type'];
                  $data['quantity']=$row['quantity'];
                  $data['amount']=$row['amount'];
                  $data['message_txn_id']=$row['message_txn_id'];
                  $data['retailer_phone']=$row['retailer_phone'];
                  $data['fse_phone']=$row['fse_phone'];
                  $data['purchase_party_id']=$row['purchase_party_id'];
                  $data['insert_at']=$row['insert_at'];
                  $data['status']=$row['status'];
                  $data['process_at']=$row['process_at'];
                  $data['update_at']=$row['update_at'];
			$response['data'][]=$data;
            }
	  $response['status']=1;
        $response['message']="Data Suucessfully Fetch";
      }
	else
	{
        $response['status']=0;
        $response['message']="No more data !!";
      }
}
else
{
	$response['status']=0;
    $response['message']="distributor_id missing";
}
echo json_encode($response);
?>