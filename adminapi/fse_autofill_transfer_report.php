<?php
include("../../connect.php");
$response = array();
if(isset($_POST['date']) && isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$cdate = $_POST['date'];
	$temp_user_id = $_POST['user_id'];
	$flag=1;
	$autorefill = array();
	$temp_tamt=$actualGrandamt=$tempCollectionAmt=$ftempCollectionAmt=$actualamt=$temp_camt=$temp_rcamt=$temp_rchamt=$temp_chamt=$temp_credit=$temp_amt=$temp_online=$temp_ronamt=0;
	$res=mysqli_query($con,"select * from tbl_autofill_retailer_message_detail where distributor_id='$session_dist_ver' and insert_date='$cdate' and status='Transfer' group by user_id");
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($res))
		{
			extract($fetch_product2);
			$user_id=$user_id;
			$user_detail=mysqli_query($con,"SELECT * from tbl_user where distributor_id='$session_dist_ver' and user_id='$user_id' ");
			while($fetch_detail_=mysqli_fetch_array($user_detail))
			{
				$user_name=$fetch_detail_['user_name'];
				$user_phone=$fetch_detail_['user_phone'];
			}
			$autorefill['user_id']=$user_id;
			$autorefill['user_name']=$user_name;
			$autorefill['user_phone']=$user_phone;

			$product = array();
			$res_=mysqli_query($con,"select * from tbl_autofill_retailer_message_detail where distributor_id='$session_dist_ver' and insert_date='$cdate' and status='Transfer' and user_id='$user_id'");
			if(mysqli_num_rows($res_)>0)
			{     
				$count=0;
				$autorefill['bill_detail']=array();
				while($fetch_product1=mysqli_fetch_array($res_))
				{

					$price=$fetch_product1['product_price_val'];
					if($price==0)
					{
						if($fetch_product1['operator_detail']=="Airtel") 
							$txn_operator='LAPU BALANCE';
						else if($fetch_product1['operator_detail']=="JIO") 
							$txn_operator='JIO BALANCE';
						$product_detail=mysqli_query($con,"select * from tbl_product where distributor_id='$session_dist_ver' and status='Active' and product_category ='$txn_operator'");
						while($fetch_price=mysqli_fetch_array($product_detail))
						{
							$price=$fetch_price['product_price'];
						}
					}

					$total_transfer_amt=$total_transfer_amt+round($fetch_product1['amount']/$price,2);
					$total_collection_val=$total_collection_val+$fetch_product1['amount'];

					if($fetch_product1['txn_status']=="Complete"){ 
						$bill= "Generated"; } else { $bill= "Not Generated"; 
					} 
					if($fetch_product1['txn_status']=="Complete" || $fetch_product1['status']=="Bill") {
						$bill_detail=mysqli_query($con,"select transaction_date from tbl_party_transaction where transaction_from='$user_id' and message_txn_id='".$fetch_product1['transaction_id']."' and transaction_date>='".$fetch_product1['insert_date']."'");
						$fetch_bill=mysqli_fetch_array($bill_detail);
						$bill_date= $fetch_bill['transaction_date'];
					}
					else { $bill_date=0; 
					}

					$count++;
					$party_phone=$fetch_product1['party_phone'];

					$party_detail=mysqli_query($con,"select * from tbl_party,tbl_user,tbl_party_user where tbl_party.party_id = tbl_party_user.party_id  and tbl_user.user_id = tbl_party_user.user_id and tbl_user.user_id='$user_id' and tbl_party.party_phone='$party_phone' order by tbl_party_user.party_user_id DESC limit 1");
					while($fetch_detail=mysqli_fetch_array($party_detail))
					{
						$party_name=$fetch_detail['party_name'];
					}
					$product['count']=$count;
					$product['party_phone']=$party_phone;
					$product['party_name']=$party_name;
					$product['transaction_id']=$fetch_product1['transaction_id'];
					$product['message_date']=$fetch_product1['message_date'];
					$product['transferred_quantity']=round($fetch_product1['amount']/$price,2);
					$product['collection_amt']=$fetch_product1['amount']; 
					$product['insert_date']=$fetch_product1['insert_date'];
					$product['bill']=$bill;
					$product['bill_date']=$bill_date;

					$autorefill['bill_detail'][]=$product;
				}

			}

			$response['autorefill'][]=$autorefill;
		}
	}
	$response['success']='1';
	$response['details']="Detail Fetched Successfully!";		
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>