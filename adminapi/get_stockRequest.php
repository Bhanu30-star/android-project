<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$ver = $_POST['distributor_id'];
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{
			
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	$res = mysqli_query($con,"select tbl_user_request.transaction_id,tbl_user_request.user_transaction_id,tbl_user_request.user_id,tbl_user.user_name,tbl_user.work_type,party_id,tbl_user.user_phone,tbl_user_request.total_amount,tbl_user_request.transaction_date,tbl_user_request.transaction_time,tbl_user_request.request_type from tbl_user_request,tbl_user where tbl_user_request.user_id=tbl_user.user_id and tbl_user_request.status='Pending' and tbl_user.distributor_id='$ver'");
	if(mysqli_num_rows($res)>0)
	{    
		$executive=array();
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$executive['request_id']=$fetch_product['transaction_id'];
			$executive['request_txn_id']=$fetch_product['user_transaction_id'];
			$executive['request_type']=$fetch_product['request_type'];
			$executive['user_id']=$fetch_product['user_id'];
			$executive['user_name']=$fetch_product['user_name'];
			$work_type=$fetch_product['request_type'];
			$executive['party_name']=''; 
			if($work_type=="FMCG")
			{
				$party_id=$fetch_product['party_id'];
				$res_party = mysqli_query($con,"select party_name from tbl_party where party_id='$party_id'"); 
				while($fetch_party=mysqli_fetch_assoc($res_party))
				{
					$executive['party_name']=$fetch_party['party_name'];
				}
			}
			
			$executive['user_phone']=$fetch_product['user_phone'];
			$executive['total_amount']=$fetch_product['total_amount'];
			$executive['transaction_date']=$fetch_product['transaction_date'];
			$executive['transaction_time']=$fetch_product['transaction_time'];
			$response['executive'][]=$executive;
		}
		$response['success']='1';
		$response['details']="Data Retrieved Successfully!";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Request Available!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing!!";
}	
echo json_encode($response);

?>