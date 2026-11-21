<?php
include("../../connect.php");
$response = array();
if(isset($_POST['cdate1']) && isset($_POST['cdate2']) &&  isset($_POST['distributor_id']))
{
	// $cdate1='2023-04-01';
	// $cdate2='2023-05-15';
	$cdate1=$_POST['cdate1'];
	$cdate2=$_POST['cdate2'];
	$ver = $_POST['distributor_id'];
	// $ver=4496;
	$flagfinal=0;
	$res = "select *  from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_user.distributor_id='$ver' and tbl_party_transaction.bill_type='Tax Invoice' and tbl_party_transaction.generated_by!='Distributor' order by transaction_bill_number ASC";

	$query1=mysqli_query($con,$res);
	$billbook=array();
	if(mysqli_num_rows($query1)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($query1))
		{
			// $bill_date=$fetch_product2['transaction_date'];
			// $bill_no=$fetch_product2['transaction_bill_number'];
			// $sale_type=$fetch_product2['payment_mode'];
			$transaction_bill_number=$fetch_product2['transaction_bill_number'];
			$party_name=$fetch_product2['party_name'];
			$party_id=$fetch_product2['party_id'];
			$dist_gst_config=$fetch_product2['gst_configure'];
			$party_phone=$fetch_product2['party_phone'];
			$mc_name=$fetch_product2['user_phone'];
			$trans_id=$fetch_product2['transaction_id'];
			$res1 = mysqli_query($con,"select *,tbl_party_transaction_detail.product_price as saleprice from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_product.maintain_inventory='Yes' and tbl_party_transaction_detail.transaction_id='$trans_id' and tbl_party_transaction_detail.product_id=380018");
			while($fetch_product3=mysqli_fetch_assoc($res1))
			{ 
				$flagfinal=1;
				if($fetch_product3['product_name']!="Airtel Money")
				{
					$actual_bill_qty=$fetch_product3['quantity'];
					if($fetch_product3['bag_type']>0)
						$actual_bill_qty=$fetch_product3['bag_qty'];

					$total_qty_val=$total_qty_val+$actual_bill_qty;
					$total_disc_val=$total_disc_val+$fetch_product3['product_disc'];

					if($dist_gst_config=="Inclusive") 
						$actual_t_amt=round($actual_bill_qty*$fetch_product3['saleprice'],2);
					else
						$actual_t_amt=round($actual_bill_qty*$fetch_product3['saleprice']+$fetch_product3['CGST_amount']+$fetch_product3['SGST_amount']+$fetch_product3['IGST_amount']+$fetch_product3['cess_final_amt'],2);
						// $total_bill_amt=$total_bill_amt+$actual_t_amt;

					$product_id_sale=$fetch_product3['product_id'];
					$product_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_stock where date<='$cdate2' and distributor_id='$ver' and product_id='380018' order by date DESC limit 1");
					if(mysqli_num_rows($product_detail)>0)
					{  
						$tamt_opening=$tamt_stockadd=$tamt_stocktrans=$tamt_stockrtn=$tamt_closing=$tamt_pdebitqty=$tsmt_pcreditqty=0;

						while($fetch_detail=mysqli_fetch_array($product_detail))
						{
							if($fetch_detail['date']==$cdate)
							{
								$tamt_opening=$fetch_detail['opening_stock'];
								$tamt_closing=$fetch_detail['closing_stock'];
							}
							else
							{
								$tamt_opening=$fetch_detail['opening_stock'];
								$tamt_closing=$fetch_detail['closing_stock'];
							}
						}
					}
					$billbook['transaction_bill_number']=$transaction_bill_number;
					$billbook['party_id']=$party_id;
					$billbook['party_name']=$party_name;
					$billbook['product_name']=$fetch_product3['product_name'];
					$billbook['quantity']=$actual_bill_qty;
					// $billbook['tamt_opening']=$tamt_opening;
					// $billbook['tamt_closing']=$tamt_closing;
				}
				$response['billbook'][]=$billbook;
			}
		}
	}

	$purchasebook=array();
	$res = mysqli_query($con,"select unique_bill,bill_date,transaction_date,purchase_type,message_txn_id,bill_type,party_id,quantity,product_id from tbl_distributor_transaction where distributor_id='$ver' and bill_date>='$cdate1' and bill_date<='$cdate2' and txn_type='Add' and purchase_category!='Opening Stock' and product_id='380018' and conversion='' group by unique_bill");
	while($fetch_product=mysqli_fetch_assoc($res))
	{
		$flagfinal=1;
		$pid=$fetch_product['party_id'];
		$product_id=$fetch_product['product_id'];
		$res_search = mysqli_query($con,"select party_name from tbl_purchase_party where distributor_id='$ver' and purchase_party_id='$pid'");
		while($fetch_psearch=mysqli_fetch_assoc($res_search))
		{
			$partyName=$fetch_psearch['party_name'];
		}
		$res_pro = mysqli_query($con,"select product_name from tbl_product where distributor_id='$ver'");
		while($fetch_pro=mysqli_fetch_assoc($res_pro))
		{
			$product_name=$fetch_pro['product_name'];
		}
		$purchasebook['pid']=$pid;
		$purchasebook['party_name']=$partyName;
		$purchasebook['product_name']=$product_name;
		$unique_bill=$fetch_product['unique_bill'];
		$quantity=$fetch_product['quantity'];
		$purchasebook['purchaseQuantity']=$quantity;
		$transaction_date=$fetch_product['transaction_date'];

		$u_bill=$fetch_product['unique_bill'];
		$bill_no=$fetch_product['bill_no'];
		$purchasebook['transaction_bill_number']=$unique_bill;
		$product_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_stock where date<='$cdate2' and distributor_id='$ver' and product_id='$product_id' order by date DESC limit 1");
		if(mysqli_num_rows($product_detail)>0)
		{  
			$tamt_opening_purchase=$tamt_closing_purchase=0;

			while($fetch_detail=mysqli_fetch_array($product_detail))
			{
				if($fetch_detail['date']==$cdate2)
				{
					$tamt_opening_purchase=$fetch_detail['opening_stock'];
					$tamt_closing_purchase=$fetch_detail['closing_stock'];
				}
				else
				{
					$tamt_opening_purchase=$fetch_detail['closing_stock'];
					$tamt_closing_purchase=$fetch_detail['closing_stock'];
				}
			}
		}
		// $purchasebook['tamt_opening_purchase']=$tamt_opening_purchase;
		// $purchasebook['tamt_closing_purchase']=$tamt_closing_purchase;
		$response['purchasebook'][]=$purchasebook;
	}
	if($flagfinal==1)
	{		
		$response['opening_stock']=$tamt_opening;
		$response['closing_stock']=$tamt_closing;
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['message']="Detail not available";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>