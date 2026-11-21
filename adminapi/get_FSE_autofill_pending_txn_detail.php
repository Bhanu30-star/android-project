<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{   
	$dist_id  = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dist_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$txn_date  = date("Y-m-d");
	$txn_date=date('Y-m-d',(strtotime ( '-30 day' , strtotime ($txn_date))));
	
	$select_request=mysqli_query($con,"SELECT * FROM tbl_autofill_retailer_message_detail WHERE distributor_id='$dist_id' and insert_date>='$txn_date' AND txn_status='Pending' and status='Transfer' group by transaction_id order by message_date asc");  
	if(mysqli_num_rows($select_request)>0)
	{
		$request=array();
		while($fetch_request=mysqli_fetch_array($select_request))
		{    
	        $request['message_id']=$fetch_request['message_id'];
			$request['message_date']=$fetch_request['message_date'];  
			$request['message_time']=$fetch_request['message_time']; 
			$request['message_transaction_id']=$fetch_request['transaction_id'];
			$request['total_amount']=$fetch_request['amount'];
			$request['status']=$fetch_request['status'];
			$request['txn_status']=$fetch_request['txn_status'];
			$request['product_price_val']=$fetch_request['product_price_val'];
			$request['operator_detail']=$fetch_request['operator_detail'];
			
			$user_id  = $fetch_request['user_id'];
			$select_user=mysqli_query($con,"SELECT * FROM tbl_user WHERE distributor_id='$dist_id' and user_id='$user_id'");
			if(mysqli_num_rows($select_user)>0)
			{     
				$fetch_user=mysqli_fetch_array($select_user);
				$request['user_detail']=$fetch_user['user_name'].'-'.$fetch_user['user_phone'];
			}
			
			$party_phone=$fetch_request['party_phone'];
			$select_party=mysqli_query($con,"SELECT * FROM tbl_party WHERE distributor_id='$dist_id' and party_phone like '%$party_phone%'");
			if(mysqli_num_rows($select_party)>0)
			{     
				while($fetch_party=mysqli_fetch_array($select_party))
				{  
				    $request['party_id']=$fetch_party['party_id'];
					$request['party_name']=$fetch_party['party_name']; 
					$request['party_phone']=$fetch_party['party_phone']; 
					$request['place_of_supply']=$fetch_party['place_of_supply']; 
					$request['party_code']=$fetch_party['party_code'];
					$request['gstin_no']=$fetch_party['gstin_no'];
				}
			}
			else 
			{
				$request['party_id']=$fetch_request['party_id'];
				$request['party_name']="";
				$request['party_phone']=""; 
				$request['place_of_supply']=""; 
				$request['party_code']="";
				$request['gstin_no']='';
			}
		    $response['request'][]=$request;
		}
		
		
		
		
		
		
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
	    $response['success']='0';
		$response['details']="No Resquest Available For This Date";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required Perameters Missing";
}	
echo json_encode($response);
?>